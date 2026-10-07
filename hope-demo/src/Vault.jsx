import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, Color, DoubleSide, MathUtils, MeshPhysicalMaterial, MeshStandardMaterial, SRGBColorSpace } from "three";

import { content, flavors } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { MOBILE } from "./canMaterial";

// "vault" (hazine dolabı): öndeki şişe siyah lake, altın işlemeli iki kapaklı bir dolabın içinde, kadife
// fonun önünde döner bir altın tablada durur. Kaydırınca kapaklar kapanır; kapalıyken şişe değişir, kapaklar
// yeniden açılırken aradaki aralıktan yeni kokunun renginde ışık sızar. İç kadife her kokunun rengini alır.
// Kapakların ön yüzündeki madalyon iki yarımdır; kapaklar kapanınca birleşir.

// Dolabın ölçüleri (birim: şişe ölçeği 1,55 iken; telefonda tümü küçülür).
export const VAULT = { W: 4.8, H: 7.05, D: 4.0, T: 0.26, Z: -0.3, PUCK: 0.4 };
const Wi = VAULT.W - 2 * VAULT.T;
const Wd = Wi / 2;
const DOOR_T = 0.16;
export const PUCK_Z = 0.1;
const MAX_OPEN = 1.85; // açık kapak açısı (radyan): kapaklar dışa, yanlara doğru açılır; önden süslemeleri görünür

// Ekran oranına göre dolabın yeri (dünya birimi) ve ölçeği; şişe tablanın üstüne oturur.
export function vaultFrame(aspect) {
  const phone = aspect < 0.9;
  const s = phone ? MathUtils.clamp((11.35 * aspect * 0.88) / VAULT.W, 0.6, 0.8) : 1;
  const x = phone ? 0 : 2.55 * MathUtils.clamp(aspect / 1.9, 0.44, 1);
  // Masaüstünde dolap ekranın dikey ortasında; telefonda üstte (alttaki yazılara yer kalır).
  const cy = phone ? 1.0 : -0.35;
  const y = cy - (VAULT.H / 2) * s;
  return { x, y, s, shelf: y + VAULT.PUCK * s, bottle: 1.55 * s };
}

// Şişenin ölçeği: dolabın içine (tepede ve yanlarda pay kalacak şekilde) sığar.
export function vaultFit(fr, bottom, top, half) {
  let sc = fr.bottle;
  if (top != null && bottom != null) sc = Math.min(sc, (0.8 * (VAULT.H - VAULT.T - VAULT.PUCK) * fr.s) / (top - bottom));
  if (half) sc = Math.min(sc, (0.36 * Wi * fr.s) / half);
  return sc;
}

const smooth = (a, b, x) => MathUtils.smoothstep(x, a, b);

// Kapak süslemesi: ince altın kafes ve ortada iki kapağa bölünen madalyon (marka baş harfleri).
const ORNAMENT = (() => {
  if (typeof document === "undefined") return null;
  const w = 1024;
  const h = Math.round((w * (VAULT.H - 2 * VAULT.T)) / Wi);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const out = {};
  const draw = () => {
  g.clearRect(0, 0, w, h);
  const gold = "rgba(226,190,120,";
  // Kafes: çapraz ince çizgiler, kenarlara doğru söner.
  g.lineWidth = 1.4;
  const step = 64;
  for (let k = -h; k < w + h; k += step) {
    g.strokeStyle = gold + "0.16)";
    g.beginPath();
    g.moveTo(k, 0);
    g.lineTo(k + h, h);
    g.moveTo(k, h);
    g.lineTo(k + h, 0);
    g.stroke();
  }
  // Kafesin düğüm noktalarında küçük altın baklava.
  g.fillStyle = gold + "0.35)";
  for (let yy = 0; yy < h; yy += step) {
    for (let xx = (yy / step) % 2 ? step / 2 : 0; xx < w; xx += step) {
      g.beginPath();
      g.moveTo(xx, yy - 4);
      g.lineTo(xx + 4, yy);
      g.lineTo(xx, yy + 4);
      g.lineTo(xx - 4, yy);
      g.fill();
    }
  }
  // Madalyonun altında kafes görünmesin.
  const cx = w / 2;
  const cy = h * 0.47;
  const R = w * 0.26;
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // Işınlar.
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const long = k % 2 === 0;
    g.strokeStyle = gold + (long ? "0.85)" : "0.45)");
    g.lineWidth = long ? 2.4 : 1.4;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8);
    g.lineTo(cx + Math.cos(a) * R * (long ? 1.18 : 1.06), cy + Math.sin(a) * R * (long ? 1.18 : 1.06));
    g.stroke();
  }
  // Çift halka.
  g.strokeStyle = gold + "1)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(cx, cy, R * 0.78, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(cx, cy, R * 0.7, 0, Math.PI * 2);
  g.stroke();
  // Marka baş harfleri (ör. O'JUVI → O'J; iki kelimeli markada iki baş harf).
  const name = String(content.brand?.name ?? content.name ?? "").trim();
  const words = name.split(/\s+/).filter(Boolean);
  const ap = name.indexOf("'");
  const mono = words.length > 1 ? words.slice(0, 2).map((x) => x[0]).join("") : ap > 0 && ap < 3 ? name.slice(0, ap + 2) : name.slice(0, 1);
  g.fillStyle = gold + "1)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `500 ${Math.round(R * 0.62)}px "Cinzel", "Cormorant Garamond", Georgia, serif`;
  g.fillText(mono.toUpperCase(), cx, cy + R * 0.04);
  if (out.left) out.left.needsUpdate = out.right.needsUpdate = true;
  };
  draw();
  // Marka yazı tipi sonradan yüklenir: yüklenince monogram onunla yeniden çizilir.
  document.fonts?.ready.then(draw);
  const tex = (off) => {
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    t.repeat.set(0.5, 1);
    t.offset.set(off, 0);
    return t;
  };
  out.left = tex(0);
  out.right = tex(0.5);
  return out;
})();

// Kadife fonun parıltısı: şişenin arkasında yumuşak bir ışık lekesi.
const GLOW = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 230, 10, 128, 260, 300);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.35, "#6a6a6a");
  grad.addColorStop(1, "#000000");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 512);
  // Pliseli kadife: ince dikey kıvrımlar.
  for (let x = 0; x < 256; x += 16) {
    const p = g.createLinearGradient(x, 0, x + 16, 0);
    p.addColorStop(0, "rgba(0,0,0,0.35)");
    p.addColorStop(0.5, "rgba(0,0,0,0)");
    p.addColorStop(1, "rgba(0,0,0,0.35)");
    g.fillStyle = p;
    g.fillRect(x, 0, 16, 512);
  }
  return new CanvasTexture(c);
})();

// Aralıktan sızan ışık: ortası parlak, kenarlara ve uçlara doğru sönen dikey şerit.
const BEAM = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d");
  const gx = g.createLinearGradient(0, 0, 128, 0);
  gx.addColorStop(0, "rgba(255,255,255,0)");
  gx.addColorStop(0.5, "rgba(255,255,255,1)");
  gx.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gx;
  g.fillRect(0, 0, 128, 256);
  g.globalCompositeOperation = "destination-in";
  const gy = g.createLinearGradient(0, 0, 0, 256);
  gy.addColorStop(0, "rgba(0,0,0,0)");
  gy.addColorStop(0.2, "rgba(0,0,0,1)");
  gy.addColorStop(0.8, "rgba(0,0,0,1)");
  gy.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gy;
  g.fillRect(0, 0, 128, 256);
  return new CanvasTexture(c);
})();

// Zemine düşen ışık yelpazesi: kapağın önünden ileri doğru açılan üçgen.
const FAN = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 0, 0, 128, 0, 256);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(118, 0);
  g.lineTo(138, 0);
  g.lineTo(256, 256);
  g.lineTo(0, 256);
  g.closePath();
  g.fill();
  return new CanvasTexture(c);
})();

function Box({ args, position, material, rotation }) {
  return (
    <mesh position={position} rotation={rotation} material={material}>
      <boxGeometry args={args} />
    </mesh>
  );
}

// Kapak: siyah lake gövde, ön yüzde altın iç çerçeve ve süsleme, arka yüzde kadife, serbest kenarda altın tutamak.
function Door({ side, refFn, M }) {
  const sgn = side === "left" ? 1 : -1;
  const inset = 0.3;
  const fz = DOOR_T / 2 + 0.012;
  const fw = Wd - 2 * inset;
  const fh = VAULT.H - 2 * VAULT.T - 2 * inset;
  return (
    <group ref={refFn} position={[-sgn * Wd, VAULT.T + (VAULT.H - 2 * VAULT.T) / 2, VAULT.D / 2]}>
      <group position={[sgn * (Wd / 2), 0, DOOR_T / 2]}>
        <Box args={[Wd - 0.012, VAULT.H - 2 * VAULT.T - 0.012, DOOR_T]} material={M.lacquer} />
        {/* Altın iç çerçeve */}
        <Box args={[fw, 0.045, 0.03]} position={[0, fh / 2, fz]} material={M.gold} />
        <Box args={[fw, 0.045, 0.03]} position={[0, -fh / 2, fz]} material={M.gold} />
        <Box args={[0.045, fh, 0.03]} position={[fw / 2, 0, fz]} material={M.gold} />
        <Box args={[0.045, fh, 0.03]} position={[-fw / 2, 0, fz]} material={M.gold} />
        {/* Süsleme (madalyonun yarısı serbest kenarda) */}
        <mesh position={[0, 0, DOOR_T / 2 + 0.004]} material={side === "left" ? M.ornL : M.ornR}>
          <planeGeometry args={[Wd - 0.012, VAULT.H - 2 * VAULT.T - 0.012]} />
        </mesh>
        {/* İç yüz: kadife */}
        <mesh position={[0, 0, -DOOR_T / 2 - 0.004]} rotation={[0, Math.PI, 0]} material={M.velvetDoor}>
          <planeGeometry args={[Wd - 0.06, VAULT.H - 2 * VAULT.T - 0.06]} />
        </mesh>
        {/* Tutamak: serbest kenarda dikey altın çubuk */}
        <mesh position={[sgn * (Wd / 2 - 0.2), 0, DOOR_T / 2 + 0.09]} material={M.gold}>
          <cylinderGeometry args={[0.045, 0.045, 1.1, 16]} />
        </mesh>
        <Box args={[0.05, 0.05, 0.09]} position={[sgn * (Wd / 2 - 0.2), 0.45, DOOR_T / 2 + 0.045]} material={M.gold} />
        <Box args={[0.05, 0.05, 0.09]} position={[sgn * (Wd / 2 - 0.2), -0.45, DOOR_T / 2 + 0.045]} material={M.gold} />
      </group>
    </group>
  );
}

export default function Vault() {
  const size = useThree((s) => s.size);
  const root = useRef();
  const puck = useRef();
  const doorL = useRef();
  const doorR = useRef();
  const beam = useRef();
  const fan = useRef();
  const lamp = useRef();
  const st = useRef({ open: 0, col: new Color(flavors[0].theme.accent) });
  const target = useMemo(() => new Color(), []);

  const M = useMemo(() => {
    const lacquer = new MeshPhysicalMaterial({ color: "#060505", roughness: 0.2, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.1 });
    const gold = new MeshStandardMaterial({ color: "#d9ad62", metalness: 1, roughness: 0.26, envMapIntensity: 1.5 });
    const velvet = new MeshPhysicalMaterial({ color: "#1a0d06", roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new Color("#f4c860"), emissive: new Color("#f4c860"), emissiveIntensity: 0.5, emissiveMap: GLOW, envMapIntensity: 0.2 });
    const velvetSide = new MeshPhysicalMaterial({ color: "#1a0d06", roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new Color("#f4c860"), envMapIntensity: 0.2 });
    const velvetDoor = velvetSide.clone();
    const ornL = new MeshStandardMaterial({ map: ORNAMENT?.left, transparent: true, metalness: 0.9, roughness: 0.3, depthWrite: false, envMapIntensity: 1.4 });
    const ornR = ornL.clone();
    ornR.map = ORNAMENT?.right;
    const strip = new MeshStandardMaterial({ color: "#000000", emissive: new Color("#fff1d6"), emissiveIntensity: 2.2 });
    const beamM = new MeshStandardMaterial({ color: "#000000", emissive: new Color("#f4c860"), emissiveMap: BEAM, alphaMap: BEAM, transparent: true, depthWrite: false, blending: AdditiveBlending, side: DoubleSide });
    const fanM = beamM.clone();
    fanM.emissiveMap = FAN;
    fanM.alphaMap = FAN;
    return { lacquer, gold, velvet, velvetSide, velvetDoor, ornL, ornR, strip, beamM, fanM };
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.getElapsedTime();
    const s = st.current;
    const { detail, order } = useStore.getState();
    const aspect = size.width / size.height;
    const fr = vaultFrame(aspect);
    const p = scrollState.p;
    // Kapaklar iki ürünün tam ortasında kapalı; ürüne yaklaşırken açılır. Açılış sahnesinde de kapalı başlar.
    const m = Math.abs(p - Math.round(p));
    const intro = smooth(0.35, 1, sceneState.intro);
    const raw = (1 - smooth(0.06, 0.4, m)) * intro;
    s.open = MathUtils.damp(s.open, raw, 7, dt);
    const ease = s.open * s.open * (3 - 2 * s.open);
    doorL.current.rotation.y = -MAX_OPEN * ease;
    doorR.current.rotation.y = MAX_OPEN * ease;

    // İç renk: ortadaki ürünün vurgusu (değişim kapaklar kapalıyken olur).
    const f = flavors[order[slotIndex(p)]] ?? flavors[0];
    target.set(f.theme.accent);
    s.col.lerp(target, 1 - Math.exp(-dt * 6));
    const dark = target.copy(s.col).multiplyScalar(0.16);
    for (const v of [M.velvet, M.velvetSide, M.velvetDoor]) {
      v.color.copy(dark);
      v.sheenColor.copy(s.col).multiplyScalar(0.55);
    }
    M.velvet.emissive.copy(s.col);
    M.velvet.emissiveIntensity = 0.16 + 0.14 * ease;
    M.beamM.emissive.copy(s.col).lerp(target.set("#ffffff"), 0.35);
    M.fanM.emissive.copy(M.beamM.emissive);

    // Sızan ışık: kapaklar aralıkken en güçlü, tam açıkken söner.
    const leak = Math.sin(Math.PI * Math.min(1, ease * 2.4)) * (ease > 0.001 ? 1 : 0) * intro;
    const gap = 2 * Wd * (1 - Math.cos(MAX_OPEN * ease));
    if (beam.current) {
      beam.current.scale.set(0.35 + gap * 1.6, 1, 1);
      beam.current.visible = leak > 0.01;
      M.beamM.opacity = leak;
      M.beamM.emissiveIntensity = 2.4 * leak;
    }
    if (fan.current) {
      fan.current.scale.set(1 + gap * 1.2, 1, 1);
      fan.current.visible = leak > 0.01;
      M.fanM.opacity = leak * 0.8;
      M.fanM.emissiveIntensity = 1.6 * leak;
    }
    if (lamp.current) {
      lamp.current.color.copy(s.col).lerp(target.set("#ffffff"), 0.4);
      lamp.current.intensity = (MOBILE ? 5 : 7) * fr.s * fr.s * (0.25 + 0.75 * ease) * intro;
    }
    // Tabla şişeyle birlikte döner (Carousel: şişe kaydırırken kendi ekseninde döner).
    if (puck.current) puck.current.rotation.y = sceneState.focus.rotation.y;

    // Ritüel'e geçerken ve detay açılınca dolap sahne asansörü gibi aşağı iner.
    const away = Math.max(sceneState.spread, detail ? 1 : 0);
    s.away = MathUtils.damp(s.away ?? 0, away, 4, dt);
    const a = s.away * s.away;
    const g = root.current;
    g.position.set(fr.x, fr.y - 14 * a, VAULT.Z * fr.s);
    g.scale.setScalar(fr.s);
    g.visible = s.away < 0.97;
  });

  const { W, H, D, T } = VAULT;
  const Hi = H - 2 * T;
  return (
    <group ref={root}>
      {/* Gövde: siyah lake. Taban ve tepe dışa taşan profilli; altın çıtalarla ayrılır. */}
      <Box args={[W + 0.3, 0.32, D + 0.3]} position={[0, -0.16, 0]} material={M.lacquer} />
      <Box args={[W + 0.36, 0.05, D + 0.36]} position={[0, 0.02, 0]} material={M.gold} />
      <Box args={[W, T, D]} position={[0, T / 2, 0]} material={M.lacquer} />
      <Box args={[T, Hi, D]} position={[-(W - T) / 2, T + Hi / 2, 0]} material={M.lacquer} />
      <Box args={[T, Hi, D]} position={[(W - T) / 2, T + Hi / 2, 0]} material={M.lacquer} />
      <Box args={[W, T, D]} position={[0, H - T / 2, 0]} material={M.lacquer} />
      <Box args={[W + 0.36, 0.05, D + 0.36]} position={[0, H + 0.02, 0]} material={M.gold} />
      <Box args={[W + 0.3, 0.3, D + 0.3]} position={[0, H + 0.18, 0]} material={M.lacquer} />
      <Box args={[W + 0.42, 0.04, D + 0.42]} position={[0, H + 0.34, 0]} material={M.gold} />
      {/* Ön altın çerçeve (açıklığın çevresi) */}
      <Box args={[Wi + 0.1, 0.06, 0.06]} position={[0, T, D / 2 + 0.02]} material={M.gold} />
      <Box args={[Wi + 0.1, 0.06, 0.06]} position={[0, H - T, D / 2 + 0.02]} material={M.gold} />
      <Box args={[0.06, Hi, 0.06]} position={[-Wi / 2, T + Hi / 2, D / 2 + 0.02]} material={M.gold} />
      <Box args={[0.06, Hi, 0.06]} position={[Wi / 2, T + Hi / 2, D / 2 + 0.02]} material={M.gold} />
      {/* İç: kadife fon ve yanlar */}
      <mesh position={[0, T + Hi / 2, -D / 2 + 0.01]} material={M.velvet}>
        <planeGeometry args={[Wi, Hi]} />
      </mesh>
      <mesh position={[-Wi / 2 + 0.005, T + Hi / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={M.velvetSide}>
        <planeGeometry args={[D, Hi]} />
      </mesh>
      <mesh position={[Wi / 2 - 0.005, T + Hi / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={M.velvetSide}>
        <planeGeometry args={[D, Hi]} />
      </mesh>
      <mesh position={[0, T + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.velvetSide}>
        <planeGeometry args={[Wi, D]} />
      </mesh>
      {/* Tepede ışık şeridi ve içeriyi kokunun renginde aydınlatan lamba */}
      <Box args={[Wi * 0.82, 0.035, 0.08]} position={[0, H - T - 0.03, D / 2 - 0.35]} material={M.strip} />
      <pointLight ref={lamp} position={[0, H - T - 0.5, D / 2 - 0.2]} intensity={0} distance={14} decay={2} />
      {/* Döner tabla: altın kenarlı siyah disk; şişe bunun üstünde durur. */}
      <group ref={puck} position={[0, T, PUCK_Z]}>
        <mesh position={[0, 0.05, 0]} material={M.gold}>
          <cylinderGeometry args={[1.3, 1.38, 0.1, 64]} />
        </mesh>
        <mesh position={[0, 0.12, 0]} material={M.lacquer}>
          <cylinderGeometry args={[1.2, 1.26, 0.04, 64]} />
        </mesh>
      </group>
      {/* Kapaklar */}
      <Door side="left" refFn={doorL} M={M} />
      <Door side="right" refFn={doorR} M={M} />
      {/* Sızan ışık: aralıkta dikey şerit ve zemine yayılan yelpaze */}
      <mesh ref={beam} position={[0, T + Hi / 2, D / 2 + DOOR_T + 0.05]} material={M.beamM} visible={false}>
        <planeGeometry args={[1, Hi * 1.15]} />
      </mesh>
      <mesh ref={fan} position={[0, -0.33, D / 2 + 2.4]} rotation={[-Math.PI / 2, 0, 0]} material={M.fanM} visible={false}>
        <planeGeometry args={[3.2, 4.4]} />
      </mesh>
    </group>
  );
}
