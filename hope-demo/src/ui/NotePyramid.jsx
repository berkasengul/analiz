import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html } from "@react-three/drei";
import { Box3, Color, DoubleSide, Plane, Vector3 } from "three";

import CanMesh, { createBottleParts, useCanBody } from "../CanMesh";
import { createCanMaterial, createCanUniforms, setCanFlavor } from "../canMaterial";
import { content, flavors } from "../data";
import { useT } from "../i18n";
import { THEME } from "../theme";

import envMap from "../assets/envMap/potsdamer_platz_0.256k.hdr?url";

// Nota piramidi (content.theme.pyramid): kaydırdıkça şişe yatay dilimlere ayrılır — kapak, üst, kalp ve dip
// notaları — her dilimin yanında o katmanın notaları yazar; bölümün sonunda şişe yeniden birleşir.
// Şişe dört kez çizilir; her kopya kesme düzlemleriyle (clipping) yalnızca kendi dilimini gösterir ve dilimle
// birlikte ayrılır. Notalar ürünün nota piramidinden (products[].composition: "Üst: …", "Kalp: …", "Dip: …"),
// yoksa notaları üçe bölünür.
export const PYRAMID = !!content.theme?.pyramid;

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Ürünün katmanları: [{ title, notes }] × 3 (üst, kalp, dip).
function layersOf(gid, lang) {
  const p = content.products[gid] ?? {};
  const comp = (lang === "en" ? p.en?.composition : null) ?? p.composition ?? [];
  const rows = comp.map((l) => /^([^:]{2,24}):\s*(.+)$/.exec(l)).filter(Boolean);
  if (rows.length >= 3) return rows.slice(0, 3).map((m) => ({ title: m[1].trim(), notes: m[2].split(/\s*,\s*/) }));
  const notes = (lang === "en" ? p.en?.notes : null) ?? p.notes ?? [];
  const n = Math.max(1, Math.ceil(notes.length / 3));
  const names = lang === "en" ? ["Top", "Heart", "Base"] : ["Üst", "Kalp", "Dip"];
  return names.map((title, i) => ({ title, notes: notes.slice(i * n, i * n + n) }));
}

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

const KEEP_ABOVE = (y) => new Plane(new Vector3(0, 1, 0), -y);
const KEEP_BELOW = (y) => new Plane(new Vector3(0, -1, 0), y);

function Slices({ index, progress, lang }) {
  const f = flavors[index];
  const canBody = useCanBody();
  const gl = useThree((s) => s.gl);
  gl.localClippingEnabled = true;
  // Dar (telefon) ekranda şişe küçülüp sola kayar, bütün etiketler sağında; kamera geri çekilir.
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const narrow = size.width / size.height < 0.8;
  const side = (k) => (narrow ? 1 : k % 2 ? -1 : 1);
  useEffect(() => {
    camera.position.z = narrow ? 13 + (0.8 - size.width / size.height) * 22 : 13;
    camera.updateProjectionMatrix();
  }, [camera, narrow, size]);
  const accent = useMemo(() => new Color(f.theme?.accent ?? THEME.accent ?? "#c9a15c"), [f]);
  const layers = useMemo(() => layersOf(f.gid, lang), [f, lang]);
  const capFrac = useMemo(() => capFracOf(f), [f]);
  // Dört dilim: kapak + üç katman. Her dilimin kendi malzemeleri ve iki kesme düzlemi var.
  const slices = useMemo(
    () =>
      [0, 1, 2, 3].map(() => {
        const uniforms = createCanUniforms(f);
        setCanFlavor(uniforms, f);
        const body = createCanMaterial(canBody, uniforms);
        const parts = createBottleParts(f);
        const planes = [KEEP_ABOVE(-99), KEEP_BELOW(99)];
        for (const m of [body, ...Object.values(parts)]) m.clippingPlanes = planes;
        return { body, parts, planes, uniforms };
      }),
    [f, canBody]
  );
  useEffect(() => {
    for (const s of slices) setCanFlavor(s.uniforms, f);
  }, [slices, f]);
  const groups = useRef([]);
  const rings = useRef([]);
  const labels = useRef([]);
  const tags = useRef([]);
  const root = useRef();
  const box = useRef(null);

  useFrame(({ clock }) => {
    const g0 = groups.current[0];
    if (!g0) return;
    // Şişenin dünyadaki boyu (dilimler toplanmışken bir kez ölçülür).
    if (!box.current) {
      for (const g of groups.current) g.position.set(0, 0, 0);
      root.current.updateWorldMatrix(true, true);
      const b = new Box3().setFromObject(g0);
      if (b.isEmpty() || !isFinite(b.min.y)) return;
      box.current = b;
    }
    const { min, max } = box.current;
    const H = max.y - min.y;
    const W = max.x - min.x;
    const p = progress.current;
    const e = smooth(0.1, 0.42, p) * (1 - smooth(0.8, 0.96, p));
    const cut = [max.y, max.y - H * capFrac];
    const body = cut[1] - min.y;
    cut.push(cut[1] - body / 3, cut[1] - (2 * body) / 3, min.y);
    const gap = H * 0.17;
    root.current.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.22 - 0.25;
    for (let k = 0; k < 4; k++) {
      const dy = (1.5 - k) * gap * e;
      const g = groups.current[k];
      g.position.y = dy;
      g.rotation.y = (k % 2 ? 1 : -1) * 0.3 * e;
      const [hi, lo] = [cut[k], cut[k + 1]];
      const s = slices[k];
      // Komşu dilimlerle dikiş görünmesin: kenarlar çok az üst üste biner.
      s.planes[0].constant = -(lo + dy - 0.002);
      s.planes[1].constant = hi + dy + 0.002;
      const ring = rings.current[k];
      if (ring && isFinite(W)) {
        ring.position.y = hi + dy - root.current.position.y;
        ring.scale.setScalar(W * 0.62 * (0.6 + 0.4 * e));
        ring.material.opacity = k === 0 ? 0 : 0.85 * e;
      }
      // Etiket dilimin ortasında, şişenin yanında (sırayla sağda ve solda).
      const tag = tags.current[k];
      // Kesim yükseklikleri dünyada; etiket ve halka bölüm grubunun içinde (grubun kaydırması çıkarılır).
      if (tag) tag.position.set(side(k) * (W * 0.5 + 0.35), (hi + lo) / 2 - root.current.position.y, 0);
      const lab = labels.current[k];
      if (lab) lab.style.opacity = String(smooth(0.16 + k * 0.06, 0.32 + k * 0.06, p) * (1 - smooth(0.8, 0.9, p)));
    }
  });

  return (
    <group ref={root} position={narrow ? [-1.25, -0.7, 0] : [0, -0.2, 0]}>
      {slices.map((s, k) => (
        <group key={k} ref={(el) => (groups.current[k] = el)}>
          <CanMesh body={s.body} parts={s.parts} flavor={index} noLiquid />
          <group ref={(el) => (tags.current[k] = el)}>
            <Html zIndexRange={[5, 0]} style={{ pointerEvents: "none", transform: side(k) < 0 ? "translate(-100%, -50%)" : "translate(0, -50%)" }}>
            <div ref={(el) => (labels.current[k] = el)} className={`pyr__label${side(k) < 0 ? " is-left" : ""}`} style={{ opacity: 0 }}>
              {k === 0 ? (
                <>
                  <span className="pyr__k mono">{f.family}</span>
                  <strong>{f.name}</strong>
                </>
              ) : (
                <>
                  <span className="pyr__k mono">{layers[k - 1]?.title}</span>
                  <strong>{layers[k - 1]?.notes.join(" · ")}</strong>
                </>
              )}
            </div>
            </Html>
          </group>
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

// Dilim etiketleri Html ile sahnede; konumları dilimle birlikte hareket eder (useFrame'de güncellenir).
export default function NotePyramid() {
  const { ui, lang } = useT();
  const ref = useRef();
  const progress = useRef(0);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(0);
  const en = lang === "en";
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(ref.current);
    let raf;
    const tick = () => {
      const r = ref.current.getBoundingClientRect();
      progress.current = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  const choices = flavors.slice(0, 5);
  return (
    <section ref={ref} id="pyramid" className="pyr">
      <div className="pyr__stage">
        <header className="pyr__head">
          <p className="mono section__eyebrow">{ui.pyramidEyebrow ?? (en ? "Fragrance pyramid" : "Nota piramidi")}</p>
          <h2 className="section__title">{flavors[active]?.name}</h2>
          <p className="pyr__hint">{ui.pyramidHint ?? (en ? "Scroll: the bottle opens layer by layer." : "Kaydırın: şişe katman katman açılsın.")}</p>
        </header>
        {near && (
          <Canvas className="pyr__canvas" camera={{ position: [0, 0, 13], fov: 35 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
            <ambientLight intensity={0.35} />
            <directionalLight position={[-5, 7, 6]} intensity={1.2} />
            <directionalLight position={[6, -1, 4]} intensity={0.5} color={content.fillLight ?? "#ffe6d0"} />
            <Suspense fallback={null}>
              <Environment files={envMap} />
              <Slices key={active} index={active} progress={progress} lang={lang} />
            </Suspense>
          </Canvas>
        )}
        {choices.length > 1 && (
          <div className="pyr__chips" role="tablist">
            {choices.map((f, i) => (
              <button key={f.gid} role="tab" aria-selected={i === active} className={`pyr__chip${i === active ? " is-on" : ""}`} onClick={() => setActive(i)}>
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
