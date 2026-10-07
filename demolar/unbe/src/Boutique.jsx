import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { AdditiveBlending, Color, CylinderGeometry, DoubleSide, MathUtils, Object3D, ShaderMaterial, TextureLoader } from "three";

import { arcPose } from "./Carousel";
import { MOBILE } from "./canMaterial";
import { flavors } from "./data";
import { scrollState } from "./scroll";
import { sceneState } from "./shared";
import { useStore } from "./store";
import { THEME } from "./theme";

// Sinematik butik ("dolly"): gerçek 3B sahne. Şişenin arkasında koyu bronz, yivli (dikey oluklu) bir duvar;
// tepeden duvara ürünün renginde bir ışık düşer, oluklar ışığı dikey parıltılarla taşır. Zemin cilalı siyah
// taş: şişeyi, kaideyi ve duvarı gerçekten yansıtır. Kaydırınca duvar yavaşça yana kayar (derinlik hissi),
// geçişte ürünün önünde ince bir duman kabarır ve şişe dumanın içinde çözülür.
const FLUTE_R = 0.2;
const PITCH = 0.44;
const COUNT = 170;
// ?slowmo=N: uçuş ve duman N kat yavaş (yavaş test tarayıcısında ara kareleri görmek için).
const SLOWMO = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("slowmo")) || 1 : 1;
// theme.wallCurve (yarıçap): duvar düz değil, ürünün arkasında içbükey bir yay (oval salon); yanlara doğru öne
// kıvrılır. Duvar daha geride durur ki iki yandaki komşu ürünler duvarın önünde görünsün.
const CURVE = THEME.wallCurve ?? 0;
const WALL_Z = CURVE ? -24 : -10;
// theme.beams: tepeden inen ürün renginde ışık huzmeleri (sisli salon spotları), duvarın önünde.
const BEAMS = THEME.beams ?? 0;
// theme.wallStyle: oluklu bronz yerine kavisli tek yüzey, kendi gölgelendiricisiyle (kokunun renginde ışık):
//   "marble"  gece mermeri: kitap gibi eşlenmiş siyah mermer paneller, altın damarlar ve altın derzler
//   "arches"  ışıklı kemerler: içleri kokunun renginde arkadan aydınlanan, altın çerçeveli kemer nişler dizisi
//   "lattice" altın kafes: arkadan aydınlanan sekiz köşeli yıldız örgülü paravan
//   "waves"   dalgalar: denizden esinli yatay dalga sırtları, sırtlarda altın
// Ürün verisinde "wall" ile her kokuya kendi duvarı verilebilir (yoksa theme.wallStyle).
// ?wall=marble|arches|lattice adresiyle denenebilir.
const WALL_STYLE = (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("wall")) || THEME.wallStyle || null;
const STYLES = { marble: 0, arches: 1, lattice: 2, waves: 3 };
// Ürüne özel duvar (products[].wall): her kokunun kendi deseni; ürün değişince desen yumuşakça diğerine geçer.
const styleOf = (f) => STYLES[(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("wall")) || f?.wall || THEME.wallStyle] ?? -1;
const STYLE_ID = Math.max(STYLES[WALL_STYLE] ?? -1, ...flavors.map(styleOf));
// Duvar yayının açısı (radyan): yay iki yanda kameranın hizasına kadar uzanır; geniş ekranda da kenarda boşluk kalmaz.
const ARC = 3.1;
// theme.wallLogo: markanın logosu kemerlerin üstündeki boş duvarda, duvarın eğrisini izleyen altın bir yazı
// ({src, width, y}: dosya, genişlik ve zeminden yükseklik; logo beyaz ve saydam zeminli olmalı).
const WALL_LOGO = THEME.wallLogo ?? null;
const TMP = new Color();

const wallMaterial = () =>
  new ShaderMaterial({
    side: DoubleSide,
    uniforms: { u_tint: { value: new Color(1, 0.8, 0.6) }, u_time: { value: 0 }, u_on: { value: 0 }, u_len: { value: 40 }, u_s1: { value: Math.max(0, STYLE_ID) }, u_s2: { value: Math.max(0, STYLE_ID) }, u_mix: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 u_tint; uniform float u_time; uniform float u_on; uniform float u_len; uniform float u_s1; uniform float u_s2; uniform float u_mix; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }
      float fbm(vec2 p) { float v = 0.; float a = 0.5; for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
      vec3 wallCol(float sty, float x, float y, vec3 tint, float pool, float amb, vec3 gold) {
        vec3 col = vec3(0.);
        if (sty < 0.5) {
          // Gece mermeri: 3,4 birimlik paneller; komşu paneller ayna (kitap eşleme). Altın derz ve damarlar.
          float W = 4.2;
          float pi = floor(x / W + 0.5);
          float lx = x - pi * W;
          lx = mod(pi, 2.) < 0.5 ? lx : -lx;
          vec2 q = vec2(abs(lx) * 0.55 + lx * 0.15, y * 0.32);
          float n = fbm(q * 1.4 + vec2(0., pi * 0.0));
          float v = abs(sin((q.x * 1.8 + q.y * 0.9 + n * 5.5)));
          float vein = (pow(1. - v, 28.) + 0.3 * pow(1. - abs(sin(q.y * 3.1 + n * 9. - q.x)), 40.)) * smoothstep(0.35, 0.7, n);
          vec3 base = vec3(0.035, 0.032, 0.034) + vec3(0.02) * fbm(q * 4.);
          float seam = 1. - smoothstep(0.0, 0.035, abs(abs(x - pi * W) - W * 0.5));
          float sheen = pow(max(0., 1. - abs(lx) / (W * 0.5)), 3.) * 0.05;
          col = base * (0.6 + 2.6 * pool * tint * 1.6) + mix(gold, tint, 0.45) * vein * (0.03 + 0.32 * pool) * amb
              + gold * seam * (0.12 + 0.9 * pool) + tint * sheen * amb;
          col *= amb + 0.15;
        } else if (sty < 1.5) {
          // Işıklı kemerler: 4,6 birim aralıklı, 2,7 genişliğinde, ~10 yüksekliğinde sivri olmayan yuvarlak kemerler.
          float S = 4.6;
          float ci = floor(x / S + 0.5);
          float lx = x - ci * S;
          float w = 1.35;
          float h0 = 8.2;
          float sd = y < h0 ? abs(lx) - w : length(vec2(lx, y - h0)) - w;
          sd = max(sd, 0.35 - y);
          float inside = 1. - smoothstep(-0.02, 0.02, sd);
          // Niş içi: arkadan aydınlanan, tepeye doğru parlayan kokunun rengi; uzak kemerler sönük.
          float far = exp(-pow(ci * S, 2.) / 160.);
          float glow = (0.18 + 0.82 * smoothstep(0.3, h0 + w, y)) * (0.25 + 0.75 * far);
          vec3 niche = mix(tint * 0.22, mix(tint, vec3(1.), 0.15) * 0.75, smoothstep(h0 - 3., h0 + w, y)) * glow * (0.35 + 0.65 * smoothstep(0.3, 0.9, 1. - abs(lx) / w));
          float frame = (1. - smoothstep(0.0, 0.05, abs(sd + 0.08))) + 0.5 * (1. - smoothstep(0.0, 0.03, abs(sd - 0.18)));
          vec3 stone = vec3(0.045, 0.038, 0.036) * (0.8 + 0.4 * fbm(vec2(x, y) * 0.7));
          col = mix(stone * (0.5 + 2.2 * pool), niche, inside) + gold * frame * (0.15 + 0.8 * far) * (0.5 + pool);
          col *= 0.35 + 0.65 * amb + 0.3 * inside * far;
          // Kemerlerin önünde zemine yakın hafif hale.
          col += tint * 0.05 * exp(-y * 0.6) * far;
        } else if (sty < 2.5) {
          // Altın kafes: sekiz köşeli yıldız örgüsü; boşluklardan kokunun rengi süzülür, çıtalar koyu bronz,
          // kenarları altın.
          vec2 g = vec2(x, y) / 2.4;
          vec2 c = fract(g) - 0.5;
          vec2 r = mat2(0.7071, -0.7071, 0.7071, 0.7071) * c;
          float sq = max(abs(c.x), abs(c.y));
          float rq = max(abs(r.x), abs(r.y));
          float star = max(sq, rq);
          float hole = 1. - smoothstep(0.30, 0.32, star);
          float ring = 1. - smoothstep(0.0, 0.025, abs(star - 0.33));
          float small = 1. - smoothstep(0.06, 0.075, length(abs(c) - vec2(0.5)));
          float lightBehind = (0.12 + 0.88 * pool) * amb * 0.75;
          vec3 behind = mix(tint, vec3(1.), 0.1) * (0.45 + 0.55 * fbm(vec2(x * 0.2, y * 0.2 - u_time * 0.03)));
          vec3 bronze = vec3(0.07, 0.05, 0.035) * (0.7 + 1.8 * pool);
          col = mix(bronze, behind * lightBehind, max(hole, small));
          col += gold * ring * (0.1 + 0.7 * pool) * amb;
        } else {
          // Dalgalar: denizden esinli, yatay akan dalga sırtları; sırtlarda altın, aralarında kokunun renginde derinlik.
          float wy = y + 0.55 * sin(x * 0.32 + y * 0.15) + 0.22 * sin(x * 0.85 - y * 0.4 + u_time * 0.05);
          float band = fract(wy / 1.15);
          float crest = smoothstep(0.0, 0.06, band) * (1. - smoothstep(0.06, 0.32, band));
          float hollow = smoothstep(0.25, 1., band);
          vec3 sea = mix(tint * 0.04, tint * 0.3, hollow) * (0.25 + 1.1 * pool);
          col = sea + mix(gold, tint, 0.2) * crest * (0.06 + 0.55 * pool) * amb;
          col *= 0.4 + 0.6 * amb;
        }
        return col;
      }
      void main() {
        float x = (vUv.x - 0.5) * u_len;
        float y = vUv.y * 30.;
        vec3 gold = vec3(0.86, 0.68, 0.38);
        vec3 tint = u_tint;
        // Işık: ürünün arkasında, duvarın alt-orta kısmında bir havuz; yukarı ve yanlara doğru karanlık.
        float pool = exp(-x * x / 70. - pow(y - 5.5, 2.) / 45.);
        float amb = (0.18 + 0.82 * exp(-x * x / 500.)) * (1. - 0.8 * smoothstep(9., 24., y));
        vec3 col = mix(wallCol(u_s1, x, y, tint, pool, amb, gold), wallCol(u_s2, x, y, tint, pool, amb, gold), u_mix);
        gl_FragColor = vec4(col * u_on, 1.);
      }`,
  });
const GOLD = new Color(THEME.accent ?? "#d4b06a");
const WHITE = new Color(1, 1, 1);
// Butik fotoğrafında (theme.plate) zemin fotoğraftan gelir: 3B zemin yalnızca ürünlerin ve kaidelerin
// yansımasını fotoğraftaki mermerin üstüne ekler (toplamalı karışım; boş yerler fotoğrafı değiştirmez).
const PLATE_FLOOR = { transparent: true, depthWrite: false, blending: AdditiveBlending, color: "#ffffff", envMapIntensity: 0, roughness: 1, metalness: 0, mirror: 1 };

const smokeMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { u_time: { value: 0 }, u_amount: { value: 0 }, u_color: { value: new Color(1, 0.9, 0.75) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */ `
      uniform float u_time; uniform float u_amount; uniform vec3 u_color; varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
      }
      float fbm(vec2 p) { float v = 0.; float a = 0.5; for (int k = 0; k < 5; k++) { v += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }
      void main() {
        vec2 p = vUv * vec2(3.2, 2.4) - vec2(0., u_time * 0.05);
        float n = fbm(p + vec2(fbm(p * 1.3 + u_time * 0.03), fbm(p + 4.1)) * 1.8);
        float wisp = smoothstep(0.42, 0.95, n);
        vec2 c = (vUv - vec2(0.5, 0.42)) * vec2(1.6, 1.3);
        float mask = exp(-dot(c, c) * 3.2) * smoothstep(0., 0.12, vUv.y);
        float a = wisp * mask * u_amount;
        gl_FragColor = vec4(u_color * a, a);
      }`,
  });

// Işık huzmesi: tepede dar ve parlak, aşağı doğru genişleyip söner; kenarlarda yumuşak, içinde yavaş duman.
const beamMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { u_time: { value: 0 }, u_color: { value: new Color(1, 0.9, 0.8) }, u_on: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `
      uniform float u_time; uniform vec3 u_color; uniform float u_on; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float fall = pow(vUv.y, 1.8) * smoothstep(0., 0.25, vUv.y);
        float haze = 0.75 + 0.25 * sin(vUv.y * 9. - u_time * 0.4 + vUv.x * 20.);
        float a = edge * fall * haze * 0.38 * u_on;
        gl_FragColor = vec4(u_color * a, a);
      }`,
  });

export default function Boutique() {
  const size = useThree((s) => s.size);
  const root = useRef();
  const wall = useRef();
  const flutes = useRef();
  const floorMat = useRef();
  const wallLight = useRef();
  const fill = useRef();
  const smoke = useRef();
  const s = useRef({ tint: new Color(), x: null });
  const smokeMat = useMemo(smokeMaterial, []);
  const beamMat = useMemo(beamMaterial, []);
  const wallMat = useMemo(wallMaterial, []);
  // Logonun yeri ve boyu: telefonda daha dar ve biraz aşağıda (üstteki sayacın altında, ekrana sığar).
  const phoneView = size.width / size.height < 0.9;
  const LOGO = WALL_LOGO
    ? { w: phoneView ? WALL_LOGO.phoneWidth ?? 7 : WALL_LOGO.width ?? 9, y: phoneView ? WALL_LOGO.phoneY ?? 11 : WALL_LOGO.y ?? 11.6, aspect: WALL_LOGO.aspect ?? 0.166 }
    : null;
  // Marka logosu: fırçalanmış altın kabartma (kenarlarda ışık ve gölge), birkaç saniyede bir üzerinden geçen
  // ince ışık süpürmesi; arkasında kokunun renginde yumuşak bir hale.
  const logoMat = useMemo(() => {
    if (!WALL_LOGO) return null;
    const tex = new TextureLoader().load(WALL_LOGO.src);
    tex.anisotropy = 8;
    return new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      uniforms: { u_map: { value: tex }, u_time: { value: 0 }, u_on: { value: 0 }, u_tint: { value: new Color(1, 0.8, 0.5) }, u_px: { value: 0.0015 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D u_map; uniform float u_time; uniform float u_on; uniform vec3 u_tint; uniform float u_px; varying vec2 vUv;
        void main() {
          // Silindirin içinden bakılıyor: yatayda aynalanır.
          vec2 uv = vec2(1. - vUv.x, vUv.y);
          float a = texture2D(u_map, uv).a;
          if (a < 0.01) discard;
          // Kabartma: sol üstten gelen ışık; kenarın ışığa bakan yüzü parlak, öbürü gölgede.
          float al = texture2D(u_map, uv + vec2(-u_px, u_px * 6.)).a;
          float ar = texture2D(u_map, uv + vec2(u_px, -u_px * 6.)).a;
          float edge = clamp(a - ar, 0., 1.) - clamp(a - al, 0., 1.) * 0.8;
          vec3 lo = vec3(0.47, 0.32, 0.13);
          vec3 hi = vec3(1.0, 0.86, 0.56);
          vec3 g = mix(lo, hi, 0.35 + 0.5 * uv.y);
          // Fırçalanmış metal: ince yatay çizgiler.
          g *= 0.93 + 0.07 * sin(uv.y * 520. + sin(uv.x * 40.) * 2.);
          // Işık süpürmesi: ~7 sn'de bir soldan sağa, hafif eğik ince parlak bant.
          float sw = fract(u_time / 7.) * 2.4 - 0.7;
          float band = exp(-pow((uv.x - sw - (uv.y - 0.5) * 0.25) / 0.035, 2.));
          g += vec3(1., 0.95, 0.85) * band * 0.85;
          g += hi * edge * 0.55;
          g = mix(g, g * (0.75 + 0.5 * u_tint), 0.18);
          gl_FragColor = vec4(g * u_on, a * u_on);
        }`,
    });
  }, []);
  const haloMat = useMemo(
    () =>
      WALL_LOGO
        ? new ShaderMaterial({
            transparent: true,
            depthWrite: false,
            blending: AdditiveBlending,
            side: DoubleSide,
            uniforms: { u_on: { value: 0 }, u_tint: { value: new Color(1, 0.8, 0.5) } },
            vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
            fragmentShader: /* glsl */ `
              uniform float u_on; uniform vec3 u_tint; varying vec2 vUv;
              void main() {
                vec2 q = (vUv - 0.5) * vec2(2., 2.);
                float h = exp(-dot(q * vec2(1.6, 2.4), q * vec2(1.6, 2.4)) * 1.4);
                gl_FragColor = vec4(mix(u_tint, vec3(1., 0.85, 0.6), 0.3) * h * 0.42 * u_on, 1.);
              }`,
          })
        : null,
    []
  );
  const beams = useRef([]);
  const fluteGeo = useMemo(() => new CylinderGeometry(FLUTE_R, FLUTE_R, 30, 20, 1, true, -Math.PI / 2, Math.PI), []);

  // Fotoğraflı butikte zemin yalnızca yansımayı ekler (toplamalı karışım); özellik olarak verilince
  // malzemeye işlenmiyordu, burada doğrudan ayarlanır.
  useEffect(() => {
    const m = floorMat.current;
    if (!THEME.plate || !m) return;
    m.transparent = true;
    m.depthWrite = false;
    m.blending = AdditiveBlending;
    m.needsUpdate = true;
  }, []);

  // Oluklar: yarım silindirler yan yana, yüzleri kameraya dönük.
  useEffect(() => {
    const o = new Object3D();
    for (let i = 0; i < COUNT; i++) {
      if (CURVE) {
        // Yay üzerinde: her oluk yayın merkezine (ürünün önüne) döner; görüş dışındakiler gizli.
        const th = ((i - COUNT / 2) * PITCH) / CURVE;
        o.position.set(CURVE * Math.sin(th), 15, CURVE - CURVE * Math.cos(th));
        o.rotation.set(0, -th, 0);
        o.scale.setScalar(Math.abs(th) < ARC / 2 ? 1 : 0);
      } else o.position.set((i - COUNT / 2) * PITCH, 15, 0);
      o.updateMatrix();
      flutes.current.setMatrixAt(i, o.matrix);
    }
    flutes.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const st = useStore.getState();
    const S = s.current;
    const asp = size.width / size.height;
    const r = arcPose(0, asp, 0, st.active);
    const floorY = sceneState.floorY ?? r.y - 4.2;
    // Kaydırınca duvar yavaşça sola kayar; oluklar periyodik olduğundan kayma dikişsiz. theme.wallStill: duvar
    // sabit kalır (ürün değişince yalnızca ışığın rengi değişir).
    const shift = THEME.wallStill ? 0 : -((scrollState.p * 1.1) % PITCH);
    root.current.position.set(0, floorY, 0);
    wall.current.position.set(r.x + shift, 0, r.z + WALL_Z);
    // Işık ürünün renginde; Ritüel ve mağazaya geçerken söner.
    S.tint.lerp(new Color(flavors[st.active].theme.glow).lerp(WHITE, 0.45), 0.05);
    const on = (1 - scrollState.ritualIn) * (1 - scrollState.shopIn) * Math.min(1, sceneState.intro * 1.3);
    const L = wallLight.current;
    L.color.copy(S.tint);
    L.intensity = 22 * on;
    // Işık havuzu şişenin tam arkasında: duvarın ortası parlak, kenarlar ve tepe karanlık.
    L.position.set(r.x, floorY + 19, r.z + WALL_Z + 9);
    L.target.position.set(r.x, floorY + 3.8, r.z + WALL_Z);
    L.target.updateMatrixWorld();
    fill.current.color.copy(S.tint);
    fill.current.intensity = 1.4 * on;
    fill.current.position.set(r.x, 2.5, r.z + WALL_Z + 2.5);
    beamMat.uniforms.u_time.value = clock.getElapsedTime();
    beamMat.uniforms.u_color.value.copy(S.tint).lerp(WHITE, 0.2);
    beamMat.uniforms.u_on.value = on * (st.detail ? 0.3 : 1);
    wallMat.uniforms.u_time.value = clock.getElapsedTime();
    // Duvarın ışığı kokunun vurgu renginde (doygun): ürün değişince yumuşakça diğerine geçer.
    wallMat.uniforms.u_tint.value.lerp(TMP.set(flavors[st.active].theme.accent), 1 - Math.exp(-dt * 2.5));
    // Mum yanıyorsa (Candle.jsx) duvarın ışığı alevle birlikte çok hafif titrer.
    const fk = sceneState.flicker != null ? 0.9 + 0.16 * sceneState.flicker : 1;
    wallMat.uniforms.u_on.value = on * (st.detail ? 0.45 : 1) * fk;
    if (logoMat) {
      logoMat.uniforms.u_on.value = on * (st.detail ? 0.4 : 1);
      logoMat.uniforms.u_time.value = clock.getElapsedTime();
      logoMat.uniforms.u_tint.value.copy(wallMat.uniforms.u_tint.value);
      haloMat.uniforms.u_on.value = on * (st.detail ? 0.3 : 1) * fk;
      haloMat.uniforms.u_tint.value.copy(wallMat.uniforms.u_tint.value);
    }
    wallMat.uniforms.u_len.value = CURVE * ARC;
    // Ürüne özel desen: öndeki ürün değişince eski desen yenisine 1,2 sn'de karışır.
    const U = wallMat.uniforms;
    const want = Math.max(0, styleOf(flavors[st.active]));
    // Karışım gerçek saate bağlı (kare hızından bağımsız).
    const now = clock.getElapsedTime();
    if (want !== U.u_s2.value) {
      U.u_s1.value = U.u_mix.value > 0.5 ? U.u_s2.value : U.u_s1.value;
      U.u_s2.value = want;
      S.mixAt = now;
    }
    U.u_mix.value = Math.min(1, (now - (S.mixAt ?? -9)) / 1.2);
    if (floorMat.current) floorMat.current.mixStrength = (THEME.plate ? 1.4 : 2.2) * on;
    // Duman: ürünün önünde; geçişte (kesirli kaydırma) kabarır, yerindeyken çok hafif.
    const fr = scrollState.p - Math.floor(scrollState.p);
    // Fotoğraflı butikte geçişte duman kabarmaz: arka plan sabit görünür.
    const trans = THEME.plate || THEME.fresh ? 0 : Math.sin(Math.PI * fr);
    // Yandaki ürüne tıklanınca (Carousel → swapAt) uçuş boyunca ekranı yumuşak bir duman bulutu sarar,
    // şişe kaideye konarken dağılır.
    const time = clock.getElapsedTime();
    const sw = sceneState.swapAt != null ? MathUtils.clamp((time - sceneState.swapAt) / (1.6 * SLOWMO), 0, 1) : 1;
    const puff = sw < 1 ? Math.pow(Math.sin(Math.PI * sw), 0.7) : 0;
    smoke.current.position.set(r.x, r.y + 0.6 + 0.8 * puff, r.z + 1.4 + 2 * puff);
    smoke.current.scale.setScalar((r.scale / 2) * (1 + 0.9 * puff));
    smokeMat.uniforms.u_time.value = time;
    const base = (THEME.fresh ? 0 : 0.05 + 0.5 * trans) * on * (st.detail ? 0 : 1);
    smokeMat.uniforms.u_amount.value = puff > 0.001 ? Math.max(base, 1.25 * puff * on) : MathUtils.damp(smokeMat.uniforms.u_amount.value, base, 5, dt);
    smokeMat.uniforms.u_color.value.copy(S.tint).lerp(WHITE, 0.25 + 0.4 * puff);
    // Butik fotoğrafı (theme.plate) varsa duvar ve zemin fotoğraftan gelir: 3B duvar, zemin ve duvar ışığı gizli.
    // Fotoğraflı butikte duvar ve zemin fotoğraftan gelir (3B duvar ve yansıtıcı zemin gizli).
    // Ferah sahnede (theme.fresh) duvar ve zemin shader'dan gelir: 3B butik de gizli.
    root.current.visible = on > 0.01 && !THEME.plate && !THEME.fresh;
    if (THEME.plate || THEME.fresh) L.intensity = 0;
  });

  return (
    <>
      <group ref={root}>
        {/* Cilalı siyah taş zemin: gerçek yansıma (bulanık, kenara doğru sönen). */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
          <planeGeometry args={[90, 50]} />
          <MeshReflectorMaterial
            ref={floorMat}
            resolution={MOBILE ? 256 : 640}
            blur={[140, 50]}
            mixBlur={0.6}
            mixStrength={2.2}
            mixContrast={1.1}
            depthScale={1.1}
            minDepthThreshold={0.25}
            maxDepthThreshold={1.3}
            roughness={1}
            metalness={0}
            envMapIntensity={0.55}
            color="#3d2e22"
            mirror={0.96}
            {...(THEME.plate ? PLATE_FLOOR : {})}
          />
        </mesh>
        <group ref={wall}>
          {/* theme.wallStyle: kavisli tek yüzey (oluklar gizli) */}
          {STYLE_ID >= 0 && CURVE > 0 && (
            <mesh material={wallMat} position={[0, 15, CURVE]}>
              <cylinderGeometry args={[CURVE, CURVE, 30, 160, 1, true, Math.PI - ARC / 2, ARC]} />
            </mesh>
          )}
          {/* Marka logosu: kemerlerin üstünde, duvarın eğrisinde altın yazı */}
          {logoMat && CURVE > 0 && (
            <group position={[0, LOGO.y, CURVE]}>
              <mesh material={haloMat} renderOrder={1}>
                <cylinderGeometry args={[CURVE - 0.1, CURVE - 0.1, LOGO.w * LOGO.aspect * 4.2, 48, 1, true, Math.PI - (LOGO.w * 1.5) / (2 * CURVE), (LOGO.w * 1.5) / CURVE]} />
              </mesh>
              <mesh material={logoMat} renderOrder={2}>
                <cylinderGeometry args={[CURVE - 0.12, CURVE - 0.12, LOGO.w * LOGO.aspect, 96, 1, true, Math.PI - LOGO.w / (2 * CURVE), LOGO.w / CURVE]} />
              </mesh>
            </group>
          )}
          {/* Yivli bronz duvar ve arkasındaki koyu yüzey */}
          <instancedMesh ref={flutes} args={[fluteGeo, null, COUNT]} visible={STYLE_ID < 0}>
            <meshStandardMaterial color="#3a2819" metalness={0.45} roughness={0.38} envMapIntensity={0.05} />
          </instancedMesh>
          <mesh position={[0, 15, -FLUTE_R]} visible={!CURVE}>
            <planeGeometry args={[COUNT * PITCH, 30]} />
            <meshStandardMaterial color="#0c0907" roughness={0.9} />
          </mesh>
          {/* Duvar dibinde ince altın süpürgelik */}
          <mesh position={[0, 0.09, FLUTE_R + 0.03]} visible={!CURVE}>
            <boxGeometry args={[COUNT * PITCH, 0.05, 0.05]} />
            <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} envMapIntensity={1.4} />
          </mesh>
          <mesh position={[0, 0.03, FLUTE_R + 0.06]} visible={!CURVE}>
            <boxGeometry args={[COUNT * PITCH, 0.06, 0.12]} />
            <meshStandardMaterial color="#070605" roughness={0.5} />
          </mesh>
          {/* Kavisli duvarın dibinde ince altın şerit (yay) */}
          {CURVE > 0 && (
            <mesh position={[0, 0.09, CURVE]} rotation={[Math.PI / 2, 0, Math.PI / 2 - ARC / 2]}>
              <torusGeometry args={[CURVE - FLUTE_R - 0.03, 0.025, 8, 160, ARC]} />
              <meshStandardMaterial color={GOLD} metalness={1} roughness={0.25} envMapIntensity={1.4} />
            </mesh>
          )}
          {/* Tepeden inen ışık huzmeleri */}
          {Array.from({ length: BEAMS }, (_, k) => (
            <mesh key={k} ref={(el) => (beams.current[k] = el)} material={beamMat} position={[(k - (BEAMS - 1) / 2) * 7.5, 9, 4]} rotation={[0, 0, (k - (BEAMS - 1) / 2) * -0.08]}>
              <cylinderGeometry args={[0.35, 2.6, 18, 48, 1, true]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* Tepeden duvara düşen ürün renginde ışık ve duvarı yumuşakça dolduran ikinci ışık. */}
      <spotLight ref={wallLight} angle={0.36} penumbra={1} decay={0} intensity={0} />
      <pointLight ref={fill} distance={9} decay={1.6} intensity={0} />
      <mesh ref={smoke} material={smokeMat} renderOrder={4}>
        <planeGeometry args={[9, 8]} />
      </mesh>
    </>
  );
}
