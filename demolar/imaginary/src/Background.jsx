import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";
import { Color, MathUtils, SRGBColorSpace, TextureLoader, Vector2, Vector3, Vector4 } from "three";

import { content, flavors } from "./data";
import { scrollState } from "./scroll";
import { SPRAY, SPRAY_SLOW, sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";

const SOLO = ["solo", "orbit", "rise", "glide", "dolly", "lake", "silk"].includes(THEME.carousel);
// Parlak zemin: "rise", "glide" ve "dolly"; altın kemer yalnızca "glide", "dolly"de karanlık sinematik stüdyo.
const FLOOR = ["rise", "glide", "dolly", "lake", "silk"].includes(THEME.carousel);
const TUNNEL = THEME.carousel === "dolly";
// Butik fotoğrafı (theme.plate = { src, aspect, x, floor }): arka planı kaplar; odak noktası (x) öndeki ürüne,
// duvar dibi (floor, fotoğrafın üstünden oran) ürünlerin zeminine hizalanır.
const PLATE = THEME.plate;
const plateTex = PLATE ? new TextureLoader().load(`${import.meta.env.BASE_URL}${PLATE.src}`, (t) => (t.colorSpace = SRGBColorSpace)) : null;
if (plateTex) plateTex.colorSpace = SRGBColorSpace;
// Ferah sahne (theme.fresh: true): fotoğraf yerine her kokunun kendi renginde aydınlık fon ve parlak zemin.
const FRESH = !!THEME.fresh && !PLATE;
// Ürünün arkasındaki süslü kemer ("glide" düzeninde); theme.arch: false ile kapanır (ör. sade, endüstriyel sahne).
const ARCH = THEME.carousel === "glide" && THEME.arch !== false;
const P = new Vector3();
const Q = new Vector3();
// Ürünlerin sahne fotoğrafları (products[].stage): bir kez yüklenir, ürünler arasında paylaşılır.
const SCENES = {};
const loader = new TextureLoader();
function sceneTex(src) {
  if (!SCENES[src]) {
    SCENES[src] = loader.load(src);
    SCENES[src].colorSpace = SRGBColorSpace;
    SCENES[src].anisotropy = 4;
  }
  return SCENES[src];
}
const spOf = (st, v) => v.set(st.aspect, st.base, st.cx, st.h);

import "./BackgroundMaterial";
import { PLINTH_H } from "./Pedestal";

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
  const last = useRef({ key: "", controls: null, at: -10, hover: false, from: null, to: null, mix: 1, stage: 1, scene: null, sceneOn: 0, sceneMix: 1 });
  const sp1 = useMemo(() => new Vector4(1, 0.6, 0.5, 0.35), []);
  const sp2 = useMemo(() => new Vector4(1, 0.6, 0.5, 0.35), []);

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
  // Sahne fotoğrafları site açılırken hemen yüklenir: ilk ürün gelince arka planı hazır olur.
  useEffect(() => {
    flavors.forEach((f) => f.stage && sceneTex(f.stage.src));
  }, []);

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
      // Ferah sahnede duvar ürünün renginde: vurgu yazıları okunur kalsın diye ürün renginin açık tonu.
      const f = flavors[l.accent];
      document.documentElement.style.setProperty("--accent", FRESH ? f.theme.drop ?? f.color : f.color);
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

    // Ürünün sahne fotoğrafı: kaidesi öndeki ürünün ayağına hizalanır, ürün değişince yumuşakça
    // diğerine geçer. Detayda, Ritüel'de ve mağazada söner (orada ürün kaideden kalkar).
    const stageOf = flavors[sceneState.heroFlavor].stage;
    const m = material.current;
    if (stageOf && stageOf !== l.scene) {
      const prev = l.scene;
      l.scene = stageOf;
      if (prev) {
        m.u_scene1 = sceneTex(prev.src);
        spOf(prev, sp1);
        l.sceneMix = 0;
      } else {
        m.u_scene1 = sceneTex(stageOf.src);
        spOf(stageOf, sp1);
        l.sceneMix = 1;
      }
      m.u_scene2 = sceneTex(stageOf.src);
      spOf(stageOf, sp2);
      m.u_sp1 = sp1;
      m.u_sp2 = sp2;
    }
    l.sceneMix = Math.min(1, l.sceneMix + Math.min(delta, 0.1) / 1.3);
    m.u_sceneMix = l.sceneMix;
    const f = sceneState.focus;
    const dt = Math.min(delta, 0.1);
    // Sahne ürüne sabitlenir ama ürünle birlikte hareket etmez: yalnızca öndeki ürün yerine oturmuşken
    // (akış durmuş, detay kapalı) ürünün dinlenme pozuna göre konumlanır; geçişte ve detayda yerinde kalır.
    // Konum bir kez (ilk ürün yerine oturunca) alınır ve sabit kalır; yalnızca pencere boyutu değişince
    // yeniden hesaplanır. Ürünler bu kaideye oturur (Carousel: ortak ayak çizgisi), sahne hiç oynamaz.
    const sizeKey = `${size.width}x${size.height}`;
    const fresh = l.baseY == null || l.sizeKey !== sizeKey;
    if (f.bottom != null && f.top != null && fresh && (sceneState.settled || l.baseY == null) && scrollState.ritualIn < 0.02) {
      l.sizeKey = sizeKey;
      const sc = f.scale || 1;
      const r = f.rest;
      // "dolly": ürün kaidenin üstünde; zemin kaidenin altında.
      const yb = (P.set(r.x, r.y + (f.bottom - PLINTH_H) * sc, r.z).project(camera).y + 1) / 2;
      const yt = (Q.set(r.x, r.y + f.top * sc, r.z).project(camera).y + 1) / 2;
      const sx = MathUtils.clamp((P.set(r.x, r.y, r.z).project(camera).x + 1) / 2, 0.2, 0.8);
      l.baseY = yb;
      l.bottleH = yt - yb;
      l.sceneX = sx;
      m.u_baseY = l.baseY;
      m.u_bottleH = Math.max(0.05, l.bottleH);
      m.u_sceneX = l.sceneX;
    }
    const onTarget =
      (SOLO && stageOf && l.baseY != null ? 1 : 0) *
      (1 - scrollState.ritualIn) *
      (1 - scrollState.shopIn) *
      Math.min(1, 0.35 + sceneState.intro);
    l.sceneOn = MathUtils.damp(l.sceneOn, onTarget, 3, dt);
    m.u_sceneOn = l.sceneOn;
    // Detayda sahne kalır (ürünün kendi arka planı) ama yazılar okunsun diye kararır; ışık huzmesi söner.
    l.sceneLight = MathUtils.damp(l.sceneLight ?? 1, st.detail ? 0 : 1, 3, dt);
    m.u_sceneLight = l.sceneLight;
    // Canlı sahne (stage.vivid): fotoğraf olduğu gibi net ve parlak; karartma ve bulanıklık kalkar.
    l.vivid = MathUtils.damp(l.vivid ?? 0, stageOf?.vivid ? 1 : 0, 2.5, dt);
    m.u_vivid = l.vivid;
    m.u_cine = THEME.cinema ? 1 : 0;
    // Koku bulucu ekrandayken fon bölümün üst kenarında biter (altında oda görünür, şişe odanın önünde).
    m.u_clip = scrollState.finderOn ? 1 - scrollState.finderTop : -1;
    // Süzülen yapraklar (theme.petals: false ile kapanır; ör. içecek markası).
    m.u_petals = THEME.petals === false ? 0 : 1;
    // Parlak zemin (rise): vitrinde tam; detayda (ürün başka yere geçer), Ritüel ve mağazada söner.
    const floorT = FLOOR && l.baseY != null ? (st.detail ? 0 : 1) * (1 - scrollState.ritualIn) * (1 - scrollState.shopIn) : 0;
    l.floor = MathUtils.damp(l.floor ?? 0, floorT, 3, dt);
    m.u_floor = l.floor;
    m.u_arch = ARCH ? l.floor : 0;
    // Koridor kemerleri kaydırmayla birlikte yaklaşır (scrollState.p: kesirli ürün sırası).
    // "dolly": arka plan gerçek 3B butik sahnesi (Boutique); shader yalnızca karanlık zemin rengini verir.
    m.u_tunnel = 0;
    m.u_noir = TUNNEL ? 1 : 0;
    if (PLATE || FRESH) {
      if (PLATE) m.u_plate = plateTex;
      const asp = size.width / size.height;
      // Duvar dibi: kaidelerin zemini, komşuların biraz arkasında.
      const fy = sceneState.floorY ?? -4.5;
      // Ürünler kayarken kemer ekranın ortasında sabit kalır (sıra hep ortadan akar); yalnızca detayda
      // ürün yana geçince fotoğraf yumuşakça onunla gider. Kameranın salınımı da fotoğrafı oynatmaz.
      // Ürünün sabit yeri yandaysa (ör. "silk": sağda) niş ve ışık havuzu orada durur.
      l.plateX = MathUtils.damp(l.plateX ?? 0, st.detail ? sceneState.focus.rest.x : sceneState.stageX ?? 0, 3, dt);
      const cxw = l.plateX;
      const sx = 0.5 + (Q.set(cxw, fy, 0).project(camera).x - P.set(0, fy, 0).project(camera).x) / 2;
      // Fotoğraf dikeyde ekranı tam kaplar (kaydırılmaz); yatayda odak noktası (kemerin ortası) öndeki ürüne gelir.
      const phone = asp < 0.9;
      // Telefonda duvar dibi kaidelerin arkasına (ekranın üstten ~%63'ü) gelir.
      if (PLATE) m.u_plateSp.set(PLATE.aspect ?? 2.63, PLATE.x ?? 0.5, PLATE.floor ?? 0.66, phone ? 0.63 : PLATE.floor ?? 0.66);
      m.u_plateScale = phone ? 0.62 : 0;
      m.u_sceneX = sx;
      // Ürünler değişirken arka plan sabit kalır.
      m.u_plateShift = 0;
      // Sinematik ışık: huzme kaidenin üstüne iner, havuz kaidenin dibinde. Geçişte (kesirli sıra) huzme
      // kısılır ve arka planın odağı kayar (daha flu); yeni ürün kaideye konunca huzme kısa bir an parlar.
      const zemin = (P.set(0, fy, 0).project(camera).y + 1) / 2;
      const ust = (Q.set(0, sceneState.plinthTop ?? fy, 0).project(camera).y + 1) / 2;
      const fr = scrollState.p - Math.floor(scrollState.p);
      const trans = Math.sin(Math.PI * fr);
      // Kaydırmayla gelen ürün oturunca ya da tıklanan ürün uçup kaideye konunca (Carousel → landAt) kısa parlama.
      if (sceneState.settled && l.landKey !== st.active) {
        if (l.landKey != null && !st.swapping) l.landAt = time;
        l.landKey = st.active;
      }
      const landAt = Math.max(l.landAt ?? -1e9, sceneState.landAt ?? -1e9);
      const flash = landAt > -1e8 ? Math.exp(-(time - landAt) * 2.2) : 0;
      l.beam = MathUtils.damp(l.beam ?? 0, (1 - 0.65 * trans) * (st.detail ? 0.2 : 1) * (phone ? 0.5 : 1) * Math.min(1, sceneState.intro * 1.3), 4, dt);
      m.u_plateFx.set(zemin, ust, l.beam, flash);
      l.blur = MathUtils.damp(l.blur ?? 1.1, (phone ? 0.8 : 1.1) + 7 * trans, 6, dt);
      m.u_plateBlur = l.blur;
      l.plateOn = MathUtils.damp(l.plateOn ?? 0, (1 - scrollState.ritualIn) * (1 - scrollState.shopIn), 3, dt);
      m.u_plateOn = PLATE ? l.plateOn : 0;
      m.u_fresh = FRESH ? l.plateOn : 0;
      // theme.decor: {niche: true, pattern: true} → kemerli niş ve geometrik desen (ferah sahnede).
      if (FRESH && THEME.decor) {
        m.u_decor.set(THEME.decor.niche === false ? 0 : 1, THEME.decor.pattern === false ? 0 : 1);
        m.u_decorShape = THEME.decor.shape === "rect" ? 1 : 0;
        // Niş öndeki ürünün boyunu izler (ürün değişince yumuşakça büyüyüp küçülür; sprey kapağı açılınca da sığar).
        const fo = sceneState.focus;
        if (fo.top != null && fo.bottom != null && fo.half && !st.detail) {
          const sc = fo.scale || 1;
          const r = fo.rest;
          const lift = sceneState.spray && time / SPRAY_SLOW - sceneState.spray.t0 < SPRAY.end ? 0.12 * (fo.top - fo.bottom) : 0;
          const yt = (P.set(r.x, r.y + (fo.top + lift) * sc, r.z).project(camera).y + 1) / 2;
          const cx = P.set(r.x, r.y + ((fo.top + fo.bottom) / 2) * sc, r.z).project(camera).x;
          const hx = ((Q.set(r.x + fo.half * sc, r.y + ((fo.top + fo.bottom) / 2) * sc, r.z).project(camera).x - cx) / 2) * asp;
          l.nTop = l.nTop == null ? yt : MathUtils.damp(l.nTop, yt, 3, dt);
          l.nHalf = l.nHalf == null ? hx : MathUtils.damp(l.nHalf, hx, 3, dt);
          m.u_decorBox.set(l.nTop, l.nHalf);
        }
      }
    }
    m.u_tp = scrollState.p;
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
    // Katman 1: zemin yansıması (Boutique) arka plan katmanını yansıtmaz; ana kamera 1. katmanı da görür.
    <mesh renderOrder={-1} frustumCulled={false} layers={1}>
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
