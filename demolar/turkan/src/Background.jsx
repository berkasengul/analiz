import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";
import { Color, MathUtils, Vector2, Vector3 } from "three";

import { content, flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";

const SOLO = THEME.carousel === "solo";
const P = new Vector3();

import "./BackgroundMaterial";

// Carousel yeni bir kutuya oturduğunda (ya da fare öndeki kutuya
// geldiğinde) kutunun etrafından o tatın renginde gürültülü bir halka
// doğar ve ekranın kenarlarına doğru yayılır.
export default function Background() {
  const material = useRef();
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const color = useMemo(() => new Color(flavors[0].color), []);
  // Her tadın kendi sahne rengi; tat değişince yumuşakça geçer.
  const glow = useMemo(() => new Color(flavors[0].theme.glow), []);
  const edge = useMemo(() => new Color(flavors[0].theme.edge), []);
  const accent = useMemo(() => new Color(flavors[0].theme.accent ?? flavors[0].theme.glow), []);
  const target = useMemo(() => ({ glow: new Color(), edge: new Color(), accent: new Color() }), []);
  const center = useMemo(() => new Vector2(0.5, 0.6), []);
  const last = useRef({ key: "", controls: null, at: -10, hover: false, from: null, to: null, mix: 1, stage: 1 });

  const pulse = (time) => {
    const l = last.current;
    l.at = time;
    l.controls?.stop();
    l.controls = animate(0, 1, {
      duration: 2.8,
      ease: easeQuadOut,
      onUpdate: (v) => material.current && (material.current.u_progress = v),
    });
  };

  useEffect(() => () => last.current.controls?.stop(), []);

  useFrame(({ clock }, delta) => {
    const l = last.current;
    const st = useStore.getState();
    const time = clock.getElapsedTime();
    const theme = flavors[sceneState.heroFlavor].theme;
    const k = 1 - Math.exp(-2.2 * Math.min(delta, 0.1));
    glow.lerp(target.glow.set(theme.glow), k);
    edge.lerp(target.edge.set(theme.edge), k);
    accent.lerp(target.accent.set(theme.accent ?? theme.glow), k);
    material.current.u_time = time;

    // Arayüzün vurgu rengi ekrandaki kutunun tadını takip eder.
    if (l.accent !== sceneState.heroFlavor) {
      l.accent = sceneState.heroFlavor;
      document.documentElement.style.setProperty("--accent", flavors[l.accent].color);
    }

    // Arkadaki şehir resmi tat değişince yumuşakça diğerine geçer.
    const tex = flavors[sceneState.heroFlavor].texture;
    if (tex && tex !== l.to) {
      l.from = l.to ?? tex;
      l.to = tex;
      l.mix = 0;
    }
    l.mix = Math.min(1, l.mix + Math.min(delta, 0.1) / 1.2);
    if (l.to) {
      material.current.u_map1 = l.from;
      material.current.u_map2 = l.to;
      material.current.u_mix = l.mix * l.mix * (3 - 2 * l.mix);
      // Arka planda etiketin arka yüzünden bulanık manzara (content.json → backdrop: false ile kapanır).
      material.current.u_hasMap = content.backdrop === false ? 0 : 1;
    }
    // Vitrin (ışık huzmesi, şehir) carousel, ritüel ve mağazada tam; detayda
    // metin okunsun diye kısılır.
    l.stage += ((st.detail ? 0.45 : 1) - l.stage) * k;
    material.current.u_stage = l.stage;
    // Işık huzmesi ve ışık havuzu kutunun ekrandaki yerini takip eder.
    const wide = size.width / size.height >= 0.9;
    let fx = 0.5;
    // Tek ürün sahnesinde huzme ve ışık havuzu tam öndeki ürünün üstüne düşer.
    if (SOLO) fx = MathUtils.clamp((P.copy(sceneState.focus.position).project(camera).x + 1) / 2, 0.2, 0.8);
    if (wide) {
      fx = MathUtils.lerp(fx, 0.68, scrollState.ritualIn);
      fx = MathUtils.lerp(fx, 0.7, scrollState.shopIn);
      if (st.detail) fx = 0.59;
    }
    l.fx = MathUtils.damp(l.fx ?? fx, fx, 4, Math.min(delta, 0.1));
    material.current.u_focusX = l.fx;
    material.current.u_studio = SOLO ? 1 : 0;
    material.current.u_dark = sceneState.spotlight;

    // Ritüel'de halka ekranın ortasından, carousel'de öndeki kutudan çıkar.
    center.y = scrollState.ritualIn > 0.5 || st.detail ? 0.5 : 0.62;

    const step = scrollState.ritualIn > 0.5 ? Math.round(scrollState.ritualStep) : -1;
    const key = `${sceneState.heroFlavor}-${step}`;
    // Tat değiştiyse, carousel durduğunda halka yayılır.
    if (key !== l.key && !st.moving && st.loaded) {
      l.key = key;
      color.set(flavors[sceneState.heroFlavor].color);
      // Carousel'de yeni tat oturunca kutudan kahve sıçrar.
      if (step < 0 && !st.detail) sceneState.burstAt = time;
      const hsl = {};
      color.getHSL(hsl);
      if (hsl.l < 0.45) color.setHSL(hsl.h, Math.max(hsl.s, 0.45), 0.45);
      pulse(time);
    }
    // Fare öndeki kutuya yeni geldiyse ve son halka bittiyse yeniden yayılır.
    if (sceneState.hoverFocus && !l.hover && time - l.at > 2.4) pulse(time);
    l.hover = sceneState.hoverFocus;
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <backgroundMaterial
        ref={material}
        depthWrite={false}
        u_aspect={size.width / size.height}
        u_color={color}
        u_center={center}
        u_glow={glow}
        u_edge={edge}
        u_accent={accent}
      />
    </mesh>
  );
}
