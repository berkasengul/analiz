import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, MathUtils, Vector3 } from "three";
import { animate } from "framer-motion";
import { easeQuadOut } from "d3-ease";

import CanMesh, { createBottleParts, dimBottleParts, useCanBody } from "./CanMesh";
import { MOBILE, createCanMaterial, createCanUniforms, setCanFlavor } from "./canMaterial";
import { THEME } from "./theme";

// Tema stüdyo ışığı: kenar ışığı ürünün kendi vurgu renginde ve güçlü, yüzeyden ışık süpürmesi geçer.
const STUDIO = !!THEME.studio;
// "solo": yan ürünler küçülüp geriye çekilir; sahne tek ürün odaklı.
const SOLO = THEME.carousel === "solo";
// Kaide için her ürünün yerel alt kenarı (şişe, set, tüp farklı boyda); ilk görüldüğünde ölçülür.
const BOTTOM = [];
// Ürünün tepesi (kapak dahil): arka plan sahnesi ürünün boyuna göre ölçeklenir.
const TOP = [];
const V = new Vector3();
import { PAGE, flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";

const N = flavors.length;
// Açık renkli ambalajlarda (krem beyazı tüp, açık etiket) spot ışığı kısılır ki
// yazılar parlamada kaybolmasın. `products[].light` ile elle de verilebilir.
const lum = (hex) => {
  const c = new Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};
export const lightOf = (f) => f.light ?? 1 - 0.5 * MathUtils.smoothstep(lum(f.labelBg ?? f.color), 0.3, 0.75);
// Az ürünlü setlerde (kategori sayfaları) ürünler sonsuz yay yerine yan yana
// düz bir sırada durur; kaydırdıkça sıradaki ürün ortaya gelir.
// Az ürünlü sette düz sıra; tek ürün sahnesinde 3+ üründe halka (öndekinin iki yanında da silüet olsun).
const LINEAR = N < 5 && !(SOLO && N >= 3);
// Kategori sayfasında üstte kategori satırı var: masaüstünde sahne biraz aşağıda durur.
const CAT_DROP = SOLO && PAGE.kind === "category" ? 0.45 : 0;
const WHITE = new Color(1, 1, 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// ?slowmo=8 adresiyle uçuş ağır çekimde oynar (animasyonu incelemek için).
const SLOWMO = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("slowmo")) || 1 : 1;
const FLIGHT = 1.15 * SLOWMO; // saniye
const KEYS = ["x", "y", "z", "rotX", "rotY", "rotZ", "scale"];

// Kutular sonsuz bir yay üzerinde dizilir. d = kutunun aktif tata uzaklığı.
export function arcPose(d, aspect, time, i) {
  const ad = Math.abs(d);
  const focus = Math.max(0, 1 - ad);
  const spread = MathUtils.clamp(aspect / 1.9, 0.44, 1);
  const base = aspect < 0.9 ? 0.78 : 1;
  if (SOLO) {
    // Tek ürün sahnesi: öndeki ürün büyük ve ışıkta; diğerleri iki yanda, geride ve loşta
    // hafifçe görünür. Telefonda yanlar ekranın kenarından yarım görünür. Kaydırınca sıradaki ışığa yürür.
    const phone = aspect < 0.9;
    return {
      x: phone ? 2.5 * d * (1 + 0.12 * ad) : (1.6 + 5.4 * d * (1 + 0.08 * ad)) * spread,
      y: 0.5 + (phone ? 0.1 : 0.12) * Math.min(ad, 3) + (phone ? 0.7 : 0.58) * focus + Math.sin(time * 0.9 + i * 1.7) * 0.07 - (phone ? 0 : CAT_DROP),
      z: (phone ? -2.4 : -2.6) * ad + focus * 1.6,
      rotX: 0.06,
      rotY: -0.3 * d + (focus > 0 ? Math.sin(time * 0.5) * 0.22 * focus : 0),
      rotZ: 0.06 * d + 0.05 * focus,
      scale: base * (phone ? 0.62 + 0.72 * focus : 0.6 + 0.84 * focus) * (1 - (LINEAR ? MathUtils.smoothstep(ad, 3.4, 4.4) : MathUtils.smoothstep(ad, Math.min(3.6, N / 2 - 0.6), Math.min(4.6, N / 2)))),
    };
  }
  return {
    x: 4.8 * d * (1 + 0.08 * ad) * spread,
    // Öndeki kutu yukarıda durur; altındaki başlık için yer kalır.
    y: 0.6 - 0.22 * Math.min(ad, 3) + 0.85 * focus + Math.sin(time * 0.9 + i * 1.7) * 0.07,
    z: -0.8 * d * d + focus * 1.2,
    rotX: 0.08,
    rotY: -0.22 * d + (focus > 0 ? Math.sin(time * 0.6) * 0.18 * focus : 0),
    rotZ: 0.1 * d + 0.12 * focus,
    scale: base * (1 + 0.36 * focus) * (1 - (LINEAR ? MathUtils.smoothstep(ad, 3.4, 4.4) : MathUtils.smoothstep(ad, Math.min(3.6, N / 2 - 0.6), Math.min(4.6, N / 2)))),
  };
}

export default function Carousel() {
  const canBody = useCanBody();
  const size = useThree((s) => s.size);
  const openDetail = useStore((s) => s.openDetail);

  const bodies = useMemo(
    () => flavors.map((f) => createCanMaterial(canBody, createCanUniforms(f))),
    [canBody]
  );
  // Her kutunun kendi alüminyumu var; detay açılınca tek tek karartılır.
  const parts = useMemo(() => flavors.map((f) => createBottleParts(f)), []);

  // Bu bileşen render edildiyse model ve doku yüklenmiştir.
  useEffect(() => useStore.getState().setSceneReady(), []);

  const groups = useRef([]);
  const spot = useRef();
  const rimColor = useMemo(() => new Color(), []);
  const local = useRef({
    p: scrollState.p,
    detail: 0,
    lean: 0,
    hovered: -1,
    hover: flavors.map(() => 0),
    now: 0,
    flights: {}, // tat → { kind: "in" | "out", t0, from }
    last: flavors.map(() => null), // her kutunun son pozu (uçuş başlangıcı için)
  });

  // Ortaya oturan kutunun yüzeyinden açık renkli, gürültülü bir ışık geçer.
  const sweep = (i) => {
    const u = bodies[i].userData.uniforms;
    const f = flavors[i];
    setCanFlavor(u, f);
    u.u_color1.value.setScalar(1.8);
    animate(0.5, 1, {
      duration: 1.2,
      ease: easeQuadOut,
      onUpdate: (v) => (u.u_progress.value = v),
      onComplete: () => setCanFlavor(u, f),
    });
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = local.current;
    const { detail, active, loaded, order } = useStore.getState();
    s.now = t;
    const slotOf = [];
    order.forEach((flavor, slot) => (slotOf[flavor] = slot));

    if (loaded) sceneState.intro = Math.min(1, sceneState.intro + dt / 2.6);
    s.p = MathUtils.damp(s.p, scrollState.p, 6, dt);
    s.detail = MathUtils.damp(s.detail, detail ? 1 : 0, 4, dt);
    // Hızlı kaydırınca kutular hafifçe yatar.
    s.lean = MathUtils.damp(s.lean, MathUtils.clamp(scrollState.velocity * 0.012, -0.35, 0.35), 5, dt);

    // Sonraki bölüme geçerken kutular kenarlara dağılır; detay açılınca ise
    // karanlığa doğru sönerek küçülür ve kenarlara çekilir.
    const spread = scrollState.ritualIn;
    const fade = s.detail;
    sceneState.spread = Math.max(spread, fade);
    const aspect = size.width / size.height;
    const nearest = order[slotIndex(s.p)];
    sceneState.hoverFocus = s.hovered === nearest && !detail && spread < 0.1 && Math.abs(s.p - Math.round(s.p)) < 0.1;

    // Kenar parıltısı ve spot ışık tadın rengini alır.
    if (STUDIO) rimColor.set(flavors[active].theme.accent).lerp(WHITE, 0.15).multiplyScalar(1.15);
    else rimColor.set(flavors[active].theme.glow).lerp(WHITE, 0.25).multiplyScalar(0.55);
    const L = spot.current;
    if (L) {
      const fp = sceneState.focus.position;
      // Sahne fotoğraflı üründe ışık tepeden, huzmeyle aynı yönden ve biraz daha güçlü vurur.
      const staged = flavors[active].stage ? 1 : 0;
      L.intensity = 7 * (MOBILE ? 0.55 : 1) * (1 + 0.35 * staged) * lightOf(flavors[active]) * (1 - fade) * (1 - spread) * sceneState.intro;
      L.color.set(STUDIO ? flavors[active].theme.accent : flavors[active].theme.glow).lerp(WHITE, STUDIO ? 0.5 : 0.65);
      if (staged) L.position.set(fp.x - 0.4, fp.y + 9.5, fp.z + 3.2);
      else L.position.set(fp.x - 1.2, fp.y + 7.5, fp.z + 7);
      L.target.position.set(fp.x, fp.y + 0.2, fp.z);
      L.target.updateMatrixWorld();
    }

    groups.current.forEach((g, i) => {
      if (!g) return;
      let d = slotOf[i] - s.p;
      if (!LINEAR) {
        d = ((d % N) + N) % N;
        if (d >= N / 2) d -= N;
      }
      let pose = arcPose(d, aspect, t, i);

      // Yer değiştirme uçuşu: gelen kutu öne doğru kavis çizip dönerek
      // ortaya gelir, giden kutu arkadan dolaşıp boşalan slota gider.
      const flight = s.flights[i];
      if (flight) {
        const k = Math.min(1, (t - flight.t0) / FLIGHT);
        const e = easeInOut(k);
        const arc = Math.sin(Math.PI * k);
        const out = {};
        for (const key of KEYS) out[key] = MathUtils.lerp(flight.from[key], pose[key], e);
        if (flight.kind === "in") {
          out.z += 3.2 * arc;
          out.y += 0.9 * arc;
          out.rotY += Math.PI * 2 * e;
          out.rotZ += 0.45 * arc;
          out.scale *= 1 + 0.2 * arc;
        } else {
          out.z -= 2.6 * arc;
          out.y -= 0.5 * arc;
          out.rotY -= Math.PI * 2 * e;
          out.rotZ -= 0.3 * arc;
          out.scale *= 1 - 0.12 * arc;
        }
        pose = out;
        if (k >= 1) {
          delete s.flights[i];
          if (flight.kind === "in") sweep(i);
        }
      }
      s.last[i] = pose;
      const intro = easeOut(MathUtils.clamp(sceneState.intro * 1.8 - Math.abs(d) * 0.16, 0, 1));
      s.hover[i] = MathUtils.damp(s.hover[i], s.hovered === i && !detail ? 1 : 0, 8, dt);
      const lift = s.hover[i];

      g.position.set(
        pose.x * (1 + 2.2 * spread + 0.9 * fade),
        pose.y - 2 * spread - (1 - intro) * 9 + lift * 0.25 - 0.4 * fade,
        pose.z - (1 - intro) * 4 - 1.5 * fade
      );
      g.rotation.set(pose.rotX, pose.rotY + (1 - intro) * 2.5, pose.rotZ + s.lean * (1 - Math.min(Math.abs(d), 4) * 0.15));
      // Detay açılınca yan ürünler kararırken küçülüp kenarlara çekilir: metnin arkasında siyah leke kalmaz.
      g.scale.setScalar(pose.scale * (1 - 0.5 * spread) * (SOLO ? 1 - MathUtils.smoothstep(fade, 0, 0.6) : 1 - 0.7 * fade) * (1 + lift * 0.06));
      // Vitrin ışığı: öndeki kutu tam aydınlık, yanlar kademeli olarak kararır.
      // Tek ürün sahnesinde ışık öndekine düşer: yanlar loşta kalır ama renkli kenar ışığıyla
      // biçimleri ve etiketleri hafifçe seçilir.
      const lit = SOLO
        ? 0.16 + 0.84 * Math.pow(Math.max(0, 1 - Math.abs(d)), 1.4)
        : 0.14 + 0.86 * Math.pow(Math.max(0, 1 - Math.min(Math.abs(d), 1.6) / 1.6), 1.6);
      const dim = (1 - fade) * lit;
      bodies[i].userData.uniforms.u_rim.value.copy(rimColor).multiplyScalar(SOLO ? (1 - fade) * (0.5 + 0.5 * lit * lit) : dim * (0.35 + 0.65 * lit));
      bodies[i].userData.uniforms.u_dim.value = dim;
      if (STUDIO) {
        const U = bodies[i].userData.uniforms;
        U.u_time.value = t;
        U.u_sweep.value = dim * lit * lit * 0.6;
        U.u_sweepColor.value.set(flavors[i].theme.accent).lerp(WHITE, 0.55);
      }
      const F = bodies[i].userData.finish;
      bodies[i].envMapIntensity = F.envMapIntensity * 1.23 * dim;
      bodies[i].clearcoat = Math.max(F.clearcoat * dim, 0.01); // 0 olursa shader yeniden derlenir
      dimBottleParts(parts[i], dim);

      // Büyük kutu buradan (dağılmadan önceki pozdan) devralır.
      if (i === nearest) {
        sceneState.focus.position.set(pose.x, pose.y - (1 - intro) * 9, pose.z - (1 - intro) * 4);
        sceneState.focus.rotation.copy(g.rotation);
        sceneState.focus.scale = pose.scale;
        if (BOTTOM[i] == null && intro > 0.999 && fade < 0.001 && spread < 0.001) {
          // Kenar düzlemleri (fin) fotoğrafın boş alanını da kapsar; yalnızca gövde parçaları ölçülür.
          // Şişe (flask) biçiminde gövde ayrı bir hacim; kapak tornası fotoğrafın tüm boyunu
          // kaplar ama gövdenin altında görünmez. Gövde varsa yalnızca o ölçülür; yoksa eksendeki
          // boş satırlar ve kenar düzlemleri dışarıda bırakılır.
          let low = Infinity;
          let high = -Infinity;
          g.updateWorldMatrix(true, true);
          const meshes = [];
          g.traverse((o) => o.isMesh && o.geometry.type !== "PlaneGeometry" && meshes.push(o));
          const bodies = meshes.filter((o) => o.geometry.type === "ExtrudeGeometry");
          for (const o of bodies.length ? bodies : meshes) {
            const P = o.geometry.attributes.position;
            for (let k = 0; k < P.count; k += 3) {
              if (P.getX(k) ** 2 + P.getZ(k) ** 2 < 1e-6) continue;
              low = Math.min(low, V.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld).y);
            }
          }
          for (const o of meshes) {
            const P = o.geometry.attributes.position;
            for (let k = 0; k < P.count; k += 3) high = Math.max(high, V.fromBufferAttribute(P, k).applyMatrix4(o.matrixWorld).y);
          }
          if (low < Infinity) BOTTOM[i] = (low - g.position.y) / g.scale.y;
          if (high > -Infinity) TOP[i] = (high - g.position.y) / g.scale.y;
        }
        sceneState.focus.bottom = BOTTOM[i];
        sceneState.focus.top = TOP[i];
      }

      const hidden = sceneState.heroVisible && i === active;
      g.visible = pose.scale > 0.001 && !hidden && spread < 0.9 && fade < 0.97;
    });
  });

  // Öndeki kutuya tıklamak detayı açar. Yandaki bir kutuya tıklamak onu
  // ortadaki kutuyla yer değiştirir (videodaki gibi); diğerleri yerinde kalır.
  const onClick = (i) => (e) => {
    e.stopPropagation();
    const st = useStore.getState();
    if (st.detail || !st.loaded || st.swapping || scrollState.ritualIn > 0.05) return;
    if (i === st.active) {
      openDetail();
      return;
    }
    // Carousel iki tat arasındayken yer değiştirme yapılmaz.
    if (Math.abs(scrollState.p - Math.round(scrollState.p)) > 0.05) return;
    const l = local.current;
    const center = slotIndex(scrollState.p);
    const current = st.order[center];
    const from = st.order.indexOf(i);
    if (!l.last[i] || !l.last[current]) return;
    l.flights[i] = { kind: "in", t0: l.now, from: { ...l.last[i] } };
    l.flights[current] = { kind: "out", t0: l.now, from: { ...l.last[current] } };
    st.swapSlots(from, center);
    st.setActive(i);
    st.setSwapping(true);
    setTimeout(() => useStore.getState().setSwapping(false), FLIGHT * 850);
  };

  const hover = (i) => (e) => {
    e.stopPropagation();
    local.current.hovered = i;
    document.body.style.cursor = useStore.getState().detail ? "" : "pointer";
  };
  const unhover = (i) => () => {
    if (local.current.hovered === i) local.current.hovered = -1;
    document.body.style.cursor = "";
  };

  return (
    <>
      {/* Öndeki kutuya düşen vitrin ışığı; ışık sayısı sabit kalsın diye hep sahnede. */}
      <spotLight ref={spot} intensity={0} angle={0.42} penumbra={1} decay={0} />
      {flavors.map((f, i) => (
        <group
          key={f.name}
          ref={(el) => (groups.current[i] = el)}
          onClick={onClick(i)}
          onPointerOver={hover(i)}
          onPointerOut={unhover(i)}
        >
          <CanMesh body={bodies[i]} parts={parts[i]} flavor={i} />
        </group>
      ))}
    </>
  );
}
