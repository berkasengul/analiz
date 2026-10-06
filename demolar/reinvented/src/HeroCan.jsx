import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box3, Color, DoubleSide, MathUtils, Plane, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector3 } from "three";

const WHITE = new Color(1, 1, 1);
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { createBottleParts, useCanBody, viewOf, viewUrl } from "./CanMesh";
import { BOUNDS, lightOf } from "./Carousel";
import { MOBILE, createCanMaterial, createCanUniforms, setCanFlavor, unlitOf } from "./canMaterial";
import { VARIETY, content, features, flavors, ritual } from "./data";
import { THEME } from "./theme";
import { pointer } from "./pointer";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { shopFlavorOf, useStore } from "./store";

const N = flavors.length;

// Galeri çekimlerinin 3B görünümleri: doku ilk seçildiğinde yüklenir, sonra önbellekte kalır.
const VIEW_TEX = new Map();
const VIEW_PARTS = new Map();
const loader = new TextureLoader();
function viewTexture(file) {
  if (!VIEW_TEX.has(file))
    VIEW_TEX.set(
      file,
      new Promise((done) =>
        loader.load(
          viewUrl(file),
          (t) => {
            t.colorSpace = SRGBColorSpace;
            t.anisotropy = 8;
            t.wrapS = RepeatWrapping;
            done(t);
          },
          undefined,
          () => done(null)
        )
      )
    );
  return VIEW_TEX.get(file);
}
function viewParts(flavor, view) {
  const key = `${flavor}:${view}`;
  if (!VIEW_PARTS.has(key)) VIEW_PARTS.set(key, createBottleParts(viewOf(flavor, view)));
  return VIEW_PARTS.get(key);
}
const SWAP = 0.9; // saniye: ürün kendi etrafında dönerken yeni görünüme geçer
const TAN = Math.tan(MathUtils.degToRad(35 / 2));
const KEYS = ["x", "y", "z", "rotX", "rotY", "rotZ", "scale"];

function lerpPose(a, b, t) {
  const out = {};
  for (const k of KEYS) out[k] = MathUtils.lerp(a[k], b[k], t);
  return out;
}

function ritualPose(step, wide, time) {
  const poses = [
    { x: 3.2, y: 0, z: 2, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.4, rotZ: -0.08, scale: 1.4 },
    { x: 3.1, y: -0.3, z: 2.2, rotX: 0.45, rotY: 0.4, rotZ: 0.08, scale: 1.45 },
    { x: 3.2, y: 0.1, z: 2, rotX: 0.1, rotY: Math.sin(time * 0.6) * 0.35, rotZ: 0.14, scale: 1.55 },
  ];
  const i = Math.min(Math.floor(step), 1);
  const p = lerpPose(poses[i], poses[i + 1], step - i);
  if (!wide) {
    p.x = 0;
    p.y = 1.7 + p.y * 0.4;
    p.z -= 1;
    p.scale *= 0.52;
  }
  return p;
}

function shopPose(wide, time) {
  return wide
    ? { x: 3.3, y: -0.1, z: 2.5, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.35, rotZ: -0.05, scale: 1.4 }
    : { x: 0, y: 2.4, z: 1, rotX: 0.05, rotY: Math.sin(time * 0.5) * 0.35, rotZ: -0.05, scale: 0.75 };
}

// Koku bulucu kaidesi (#finder-seat): kutunun ekrandaki yeri 3B dünyaya taşınır; şişenin ayağı kaidenin
// üstüne, boyu kutunun boyuna oturur. Kamera her karede değiştiği için ışın z düzlemiyle kesiştirilir.
const SEAT_Z = 1.6;
const R0 = new Vector3();
const R1 = new Vector3();
function screenToWorld(camera, x, y, out) {
  R0.set(x * 2 - 1, 1 - y * 2, 0.5).unproject(camera).sub(camera.position).normalize();
  return out.copy(camera.position).addScaledVector(R0, (SEAT_Z - camera.position.z) / R0.z);
}
function finderPose(camera, size, flavor, time, id = "finder-seat") {
  const el = document.getElementById(id);
  const bottom = BOUNDS.bottom[flavor];
  const top = BOUNDS.top[flavor];
  if (!el || bottom == null || top == null) return null;
  const r = el.getBoundingClientRect();
  const cx = (r.left + r.width / 2) / size.width;
  screenToWorld(camera, cx, r.bottom / size.height, R1);
  const foot = R1.clone();
  screenToWorld(camera, cx, r.top / size.height, R1);
  const scale = (R1.y - foot.y) / Math.max(top - bottom, 0.1);
  return { x: foot.x, y: foot.y - bottom * scale, z: SEAT_Z, rotX: 0.02, rotY: Math.sin(time * 0.45) * 0.3, rotZ: 0, scale };
}

// Videodan ölçülen detay kompozisyonu: kutu ekranın ~%58'inde, üstü
// kesik, altı ekranın dibine yakın. Özelliklerde kutu dönüp kayar.
function detailPose(feature, wide, time, turn) {
  const f = feature != null ? features[feature].pose : null;
  const idle = Math.sin(time * 0.5) * 0.2 + pointer.x * 0.15;
  const base = wide
    ? { x: 1.3, y: -0.7, z: 3, rotX: 0.03 + pointer.y * 0.04, rotY: idle, rotZ: 0.03, scale: 2.05 }
    : { x: 0, y: 1.55, z: 2, rotX: 0.04, rotY: idle, rotZ: 0.04, scale: 1.2 };
  if (f) {
    base.rotY = f.rotY + Math.sin(time * 0.4) * 0.04 + pointer.x * 0.05;
    base.rotZ = f.rotZ;
    base.rotX = 0.02;
    if (wide) {
      base.y = f.y;
      base.scale = f.scale;
    } else {
      // Telefonda ürün ekranın üst yarısını doldurur; alttaki kısa bilgi kartına binmez.
      base.y = 1.5 + (f.y + 0.9) * 0.1;
      base.scale = 1.2 * Math.min(f.scale / 2.05, 1.1);
    }
  }
  base.rotY += turn;
  return base;
}

// ---------------------------------------------------------------- nota piramidi: katmanlara ayrılan şişe
// Bölümde (scrollState.pyrP) şişe dört dilime ayrılır: kapak, üst, kalp, dip. Şişe dört kez çizilir; her kopya
// iki kesme düzlemiyle (dünya uzayında, yatay) yalnızca kendi dilimini gösterir ve dilimle birlikte ayrılır.
// Dilimlerin ekrandaki yeri sceneState.pyramid'e yazılır; notaları ui/NotePyramid.jsx bu konumlara dizer.
const PYRAMID = !!content.theme?.pyramid;
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Kapağın bittiği yer, şişe boyuna oranla (fotoğraftan yapılan şişede boyun satırı; yoksa dörtte bir).
function capFracOf(f) {
  const P = f.photo3d;
  const rows = P?.rows ?? [];
  const nz = rows.map((r, i) => (r > 0 ? i : -1)).filter((i) => i >= 0);
  if (!P?.neck || !nz.length) return 0.26;
  const top = nz[0] / rows.length;
  const bot = (nz[nz.length - 1] + 1) / rows.length;
  return Math.min(0.45, Math.max(0.12, (P.neck - top) / (bot - top)));
}
const _box = new Box3();
const _p = new Vector3();
function Slices({ canBody, uniforms, flavor, hero, main }) {
  const f = flavors[flavor];
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  gl.localClippingEnabled = true;
  const capFrac = useMemo(() => capFracOf(f), [f]);
  const accent = useMemo(() => new Color(f.theme?.accent ?? THEME.accent ?? "#c9a15c").lerp(WHITE, 0.15), [f]);
  const slices = useMemo(
    () =>
      [0, 1, 2, 3].map(() => {
        const body = createCanMaterial(canBody, uniforms);
        const parts = createBottleParts(f);
        const planes = [new Plane(new Vector3(0, 1, 0), 99), new Plane(new Vector3(0, -1, 0), 99)];
        for (const m of [body, ...Object.values(parts)]) m.clippingPlanes = planes;
        return { body, parts, planes };
      }),
    [canBody, uniforms, f]
  );
  const root = useRef();
  const groups = useRef([]);
  const rings = useRef([]);
  const ext = useRef(null); // şişenin hero grubundaki alt/üst sınırı ve genişliği
  useFrame(() => {
    const H = hero.current;
    const r = scrollState;
    const p = r.pyrP;
    // Sinematik açılış: dilimler kaydırmaya bağlı olarak sırayla ayrılır (önce kapak, sonra üst, kalp, dip);
    // bölüm sonunda tersten sırayla birleşir. ek: dilimin kendi açılma oranı, e: ortalaması (halkalar, yazılar).
    const gate = r.pyrOn && !r.pyrPast ? Math.min(1, r.pyrIn * 1.2) * (1 - r.finderIn) : 0;
    const ease3 = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const ek = [0, 1, 2, 3].map((k) => gate * ease3(smoothstep(0.06 + k * 0.11, 0.3 + k * 0.11, p)) * (1 - ease3(smoothstep(0.8 + (3 - k) * 0.035, 0.92 + (3 - k) * 0.025, p))));
    const e = (ek[0] + ek[1] + ek[2] + ek[3]) / 4;
    sceneState.pyramid = sceneState.pyramid ?? { e: 0, flavor, labels: [] };
    sceneState.pyramid.e = e;
    sceneState.pyramid.flavor = flavor;
    const on = e > 0.002;
    main.current.visible = !on || !ext.current;
    root.current.visible = on && !!ext.current;
    // Sınırlar şişe bütünken bir kez ölçülür (hero grubunun yerel uzayında).
    if (!ext.current) {
      // Ölçüm şişe yuvada dik dururken (Ritüel pozlarında eğik durur).
      if (!H.visible || H.scale.y < 0.01 || r.pyrIn < 0.95 || Math.abs(H.rotation.x) > 0.06) return;
      H.updateWorldMatrix(true, true);
      _box.setFromObject(main.current);
      if (_box.isEmpty() || !isFinite(_box.min.y)) return;
      const sc = H.scale.y;
      ext.current = { lo: (_box.min.y - H.position.y) / sc, hi: (_box.max.y - H.position.y) / sc, w: (_box.max.x - _box.min.x) / sc };
    }
    const { lo, hi, w } = ext.current;
    const Hh = hi - lo;
    const cut = [hi, hi - Hh * capFrac];
    const bodyH = cut[1] - lo;
    cut.push(cut[1] - bodyH / 3, cut[1] - (2 * bodyH) / 3, lo);
    const gap = Hh * 0.115;
    const sc = H.scale.y;
    const narrow = size.width / size.height < 0.8;
    const labels = sceneState.pyramid.labels;
    for (let k = 0; k < 4; k++) {
      const ex = ek[k];
      const dy = (1.5 - k) * gap * ex;
      const g = groups.current[k];
      g.position.y = dy;
      // Açılırken dilim kendi ekseninde döner ve hafifçe öne süzülür (orta dilimler daha çok).
      g.rotation.y = (k % 2 ? 1 : -1) * 0.38 * ex;
      g.position.z = (k === 1 || k === 2 ? 0.1 : 0.04) * Hh * ex;
      const s = slices[k];
      // Kesim düzlemleri dünyada (şişe dik durur; hafif eğim ihmal edilir). Komşu dilimler çok az üst üste biner.
      s.planes[0].constant = -(H.position.y + (cut[k + 1] + dy) * sc - 0.003);
      s.planes[1].constant = H.position.y + (cut[k] + dy) * sc + 0.003;
      const ring = rings.current[k];
      ring.position.y = cut[k] + dy;
      ring.scale.setScalar(w * 0.62 * (0.6 + 0.4 * ex));
      ring.material.opacity = k === 0 ? 0 : 0.85 * ex;
      // Etiketin ekrandaki yeri: dilimin ortası, şişenin yanında (telefonda hep sağda).
      const side = narrow || k % 2 === 0 ? 1 : -1;
      _p.set(side * (w * 0.5 + 0.25), (cut[k] + cut[k + 1]) / 2 + dy, 0).applyMatrix4(H.matrixWorld).project(camera);
      labels[k] = { x: (_p.x * 0.5 + 0.5) * size.width, y: (0.5 - _p.y * 0.5) * size.height, side, e: ex };
    }
  });
  return (
    <group ref={root} visible={false}>
      {slices.map((s, k) => (
        <group key={k} ref={(el) => (groups.current[k] = el)}>
          <CanMesh body={s.body} parts={s.parts} flavor={flavor} noLiquid />
        </group>
      ))}
      {[0, 1, 2, 3].map((k) => (
        <mesh key={`r${k}`} ref={(el) => (rings.current[k] = el)} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
          <ringGeometry args={[0.92, 1, 96]} />
          <meshBasicMaterial color={accent} transparent opacity={0} side={DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// Tek büyük kutu: carousel'deki aktif kutunun yerinden devralır ve sayfa
// boyunca detay, Ritual ve Shop bölümlerinde farklı pozlara geçer.
// Gösterdiği tat değişince Codrops gürültülü doku geçişini oynatır.
export default function HeroCan() {
  const canBody = useCanBody();
  // Her ürünün kendi ambalaj malzemeleri; gösterilen ürüne göre seçilir.
  const allParts = useMemo(() => flavors.map((f) => createBottleParts(f)), []);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);

  const uniforms = useMemo(() => createCanUniforms(flavors[0]), []);
  const body = useMemo(() => createCanMaterial(canBody, uniforms), [canBody, uniforms]);

  const group = useRef();
  const main = useRef();
  const spot = useRef();
  const l = useRef({
    detailT: 0,
    target: 0,
    controls: null,
    drag: 0,
    dragTarget: 0,
    dragging: null,
    feature: null,
    poseFeature: null,
    featureAt: 0,
    pose: null,
    wasDetail: false,
    spot: 0,
    sweepAt: 0,
  });

  // Detayda kutuyu sürükleyerek döndürme.
  useEffect(() => {
    const move = (e) => {
      const s = l.current;
      if (s.dragging == null) return;
      s.dragTarget += (e.clientX - s.dragging) * 0.012;
      s.dragging = e.clientX;
    };
    const up = () => {
      l.current.dragging = null;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  // Ürünlerin biçimi farklı olabilir (şişe / tüp): gösterilen ürünle değişir.
  const [shown, setShown] = useState(0);
  const [shownView, setShownView] = useState(null);
  const parts = shownView != null ? viewParts(shown, shownView) : allParts[shown];

  const showFlavor = (next, animated) => {
    const s = l.current;
    s.target = next;
    setShown(next);
    // Başka ürüne geçince galeri görünümü bırakılır.
    s.swap = null;
    s.viewWant = null;
    setShownView(null);
    s.controls?.stop();
    const f = flavors[next];
    if (!animated) {
      setCanFlavor(uniforms, f);
      return;
    }
    uniforms.u_color1.value.copy(uniforms.u_color2.value);
    uniforms.u_ink1.value.copy(uniforms.u_ink2.value);
    uniforms.u_color2.value.setScalar(1);
    uniforms.u_map1.value = uniforms.u_map2.value;
    uniforms.u_map2.value = f.texture;
    uniforms.u_ink2.value.set(f.ink);
    uniforms.u_unlit.value = unlitOf(f);
    s.controls = animate(0.5, 1, {
      duration: 1.1,
      ease: easeQuadOut,
      onUpdate: (v) => (uniforms.u_progress.value = v),
      onComplete: () => setCanFlavor(uniforms, f),
    });
  };

  const sweep = () => {
    const s = l.current;
    const f = flavors[s.target];
    s.controls?.stop();
    setCanFlavor(uniforms, f);
    uniforms.u_color1.value.setScalar(1.8);
    uniforms.u_ink1.value.set(f.ink);
    s.controls = animate(0.5, 1, {
      delay: 0.35,
      duration: 1.3,
      ease: easeQuadOut,
      onUpdate: (v) => (uniforms.u_progress.value = v),
      onComplete: () => setCanFlavor(uniforms, f),
    });
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = clock.getElapsedTime();
    uniforms.u_time.value = time;

    const st = useStore.getState();
    const s = l.current;
    const r = scrollState;
    s.detailT = MathUtils.damp(s.detailT, st.detail ? 1 : 0, 4.2, dt);
    // Özellik değişince önce eski yazı çıkar; kutu kısa bir gecikmeyle hareket eder.
    if (st.feature !== s.feature) {
      s.feature = st.feature;
      s.featureAt = time;
      s.dragTarget = 0;
    }
    if (s.poseFeature !== s.feature && time - s.featureAt > 0.22) {
      s.poseFeature = s.feature;
      s.sweepAt = time;
    }

    // Sinematik mod: özellik yakın çekiminde etikete spot ışık düşer, arka
    // plan kararır. Işık kısa bir süzülmeyle soldan etiketin üstüne gelir.
    const focusOn = st.detail && s.poseFeature != null;
    s.spot = MathUtils.damp(s.spot, focusOn ? 1 : 0, 3, dt);
    sceneState.spotlight = s.spot;
    const sweepK = 1 - Math.pow(1 - Math.min(1, (time - s.sweepAt) / 1.4), 3);
    const light = spot.current;
    light.intensity = s.spot * 9 * lightOf(flavors[s.target]) * (MOBILE ? 0.35 : 1);
    light.position.set(group.current.position.x - 2.8 + sweepK * 2.6, group.current.position.y * 0.2 + 2.2, 11);
    light.target.position.set(group.current.position.x, 0.2, group.current.position.z);
    light.target.updateMatrixWorld();
    // Ortam yansımaları azalır ki spot ışığın kontrastı öne çıksın.
    body.envMapIntensity = (body.userData.finish.envMapIntensity / 1.1) * (1.35 - 0.75 * s.spot);
    parts.metal.envMapIntensity = 1.3 - 0.7 * s.spot;
    // Detay açılınca kutunun yüzeyinden açık renkli bir ışık süpürmesi geçer.
    if (st.detail && !s.wasDetail) sweep();
    s.wasDetail = st.detail;
    if (!st.detail) s.dragTarget = 0;
    s.drag = MathUtils.damp(s.drag, s.dragTarget, 6, dt);

    // Koku bulucuda sonuç seçilince şişe kaideden kalkar (sonucun görseli iner).
    const away = !r.finderHold && r.finderIn > 0.5 && !r.finderPast && !st.detail;
    const visible = (r.ritualIn > 0.002 || s.detailT > 0.01) && !away;
    sceneState.heroVisible = visible;
    group.current.visible = visible;

    // Gösterilecek tat: mağazada seçilen, yoksa carousel'deki aktif tat.
    // Gösterilecek tat: mağazada seçilen, Ritual'da adımın tadı,
    // aksi halde carousel'deki aktif tat.
    let want = st.active;
    if (!st.detail && r.pyrIn > 0.5 && !r.pyrPast && r.pyrFlavor != null && r.finderIn < 0.5) {
      want = r.pyrFlavor;
    } else if (!st.detail && r.shopIn > 0.5) {
      const shop = shopFlavorOf(st);
      want = shop === VARIETY ? Math.floor(time / 1.8) % N : shop;
    } else if (!st.detail && r.ritualIn > 0.5) {
      want = ritual[Math.round(r.ritualStep)].flavor;
    }
    if (want !== s.target) showFlavor(want, visible);

    // Galeri görünümü seçildi: doku yüklenince ürün kendi etrafında döner, arkası dönükken
    // yeni biçime ve dokuya geçer.
    const wantView = st.detail ? st.view : null;
    if (wantView !== (s.viewWant ?? null) && !s.swapLoading) {
      s.viewWant = wantView;
      const target = s.target;
      const file = wantView != null ? flavors[target].views?.[wantView]?.file : null;
      const go = (tex) => {
        if (s.target !== target) return;
        s.swap = { t0: -1, to: wantView, tex, applied: false };
      };
      if (file) {
        s.swapLoading = true;
        viewTexture(file).then((tex) => {
          s.swapLoading = false;
          tex ? go(tex) : (s.viewWant = null);
        });
      } else go(flavors[target].texture);
    }
    sceneState.heroFlavor = want;
    if (THEME.studio) {
      uniforms.u_rim.value.set(flavors[want].theme.accent).lerp(WHITE, 0.15).multiplyScalar(1.05 * (1 - 0.4 * s.spot));
      uniforms.u_sweep.value = 0.8;
      uniforms.u_sweepColor.value.set(flavors[want].theme.accent).lerp(WHITE, 0.55);
    } else uniforms.u_rim.value.set(flavors[want].theme.glow).lerp(WHITE, 0.25).multiplyScalar(0.5 * (1 - 0.6 * s.spot));
    if (!visible) {
      s.scrollPose = null;
      return;
    }

    const wide = size.width / size.height >= 0.9;
    const focus = sceneState.focus;
    let pose = {
      x: focus.position.x,
      y: focus.position.y,
      z: focus.position.z,
      rotX: focus.rotation.x,
      rotY: focus.rotation.y,
      rotZ: focus.rotation.z,
      scale: focus.scale,
    };
    pose = lerpPose(pose, ritualPose(r.ritualStep, wide, time), r.ritualIn);
    pose = lerpPose(pose, shopPose(wide, time), r.shopIn);
    pose.y += r.shopOut * 2 * (18 - pose.z) * TAN;
    // Kaydırmaya bağlı poz yumuşatılır: hızlı kaydırmada kutu savrulmaz,
    // düzenli ve ağır bir hareketle yeni yerine süzülür.
    if (!s.scrollPose) s.scrollPose = { ...pose };
    else for (const k of KEYS) s.scrollPose[k] = MathUtils.damp(s.scrollPose[k], pose[k], 4.5, dt);
    pose = { ...s.scrollPose };
    // Ritüel'den koku bulucuya: şişe aşağıdaki kutunun kaidesine iner ve kutuyla birlikte kayar
    // (yumuşatmasız: bölümle aynı anda hareket eder, havada kalmaz).
    // Bölüm yukarıda kalınca (mağaza ve sonrası) şişe kendi pozlarına döner.
    // Nota piramidi: şişe bölümün yuvasına (#pyramid-seat) iner, bölüm boyunca orada durur; aşağıdaki koku
    // bulucu gelince oradan kaideye geçer (yukarıdaki kural pozu ondan devralır).
    if (r.pyrIn > 0.001 && !r.pyrPast && !st.detail) {
      const pp = finderPose(camera, size, s.target, time, "pyramid-seat");
      if (pp) {
        pp.rotY = Math.sin(time * 0.35) * 0.25 - 0.2;
        const k = r.pyrIn;
        pose = lerpPose(pose, pp, k);
        pose.y += Math.sin(Math.PI * k) * 0.25 * pp.scale;
      }
    }
    if (r.finderIn > 0.001 && r.finderHold && !r.finderPast && !st.detail) {
      const fp = finderPose(camera, size, s.target, time);
      if (fp) {
        const k = r.finderIn;
        pose = lerpPose(pose, fp, k);
        pose.y += Math.sin(Math.PI * k) * 0.25 * fp.scale;
      }
    }
    // Detay içindeki pozlar arasında yumuşak ama hızlı geçiş (~0,7 sn).
    const target = detailPose(s.poseFeature, wide, time, s.drag);
    if (!s.pose || !st.detail) s.pose = { ...target };
    else for (const k of KEYS) s.pose[k] = MathUtils.damp(s.pose[k], target[k], 5.5, dt);
    pose = lerpPose(pose, s.pose, s.detailT);

    if (s.swap) {
      if (s.swap.t0 < 0) s.swap.t0 = time;
      const k = visible ? Math.min(1, (time - s.swap.t0) / SWAP) : 1;
      if (k >= 0.5 && !s.swap.applied) {
        s.swap.applied = true;
        s.controls?.stop();
        setShownView(s.swap.to);
        setCanFlavor(uniforms, { ...flavors[s.target], texture: s.swap.tex });
      }
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      pose.rotY += e * Math.PI * 2;
      pose.scale *= 1 - 0.3 * Math.sin(Math.PI * k);
      if (k >= 1) s.swap = null;
    }

    group.current.position.set(pose.x, pose.y, pose.z);
    group.current.rotation.set(pose.rotX, pose.rotY, pose.rotZ);
    group.current.scale.setScalar(pose.scale);
  });

  return (
    <>
    {/* Hep sahnede; yoğunluğu 0 iken görünmez. Işık sayısı sabit kaldığı
        için shader'lar yeniden derlenmez. */}
    <spotLight
      ref={spot}
      intensity={0}
      angle={0.32}
      penumbra={1}
      decay={0}
      color="#ffe6c7"
    />
    <group
      ref={group}
      visible={false}
      onPointerDown={(e) => {
        if (!useStore.getState().detail) return;
        e.stopPropagation();
        l.current.dragging = e.clientX;
        document.body.style.cursor = "grabbing";
      }}
    >
      <group ref={main}>
        <CanMesh body={body} parts={parts} flavor={shown} view={shownView} />
      </group>
      {PYRAMID && shownView == null && <Slices key={shown} canBody={canBody} uniforms={uniforms} flavor={shown} hero={group} main={main} />}
    </group>
    </>
  );
}
