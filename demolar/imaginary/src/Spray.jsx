import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial, Vector3 } from "three";

import { MOBILE } from "./canMaterial";
import { flavors } from "./data";
import { SPRAY, SPRAY_SLOW, sceneState } from "./shared";

// Parfüm buğusu (content.spray): sprey başlığının deliğinden çıkan ince sis, ışıkta parlayan damlacıklar
// ve havada yavaşça açılıp dağılan yumuşak bir bulut. Parçacıkların bütün hareketi shader'da, tek bir
// başlangıç anı (u_t0), ağız konumu (u_origin) ve yönünden (u_dir) hesaplanır; her sıkmada yeniden oynar.
const COUNT = MOBILE ? 700 : 1500;
const WHITE = new Color(1, 1, 1);

export default function Spray() {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const seed = new Float32Array(COUNT * 4);
    const kind = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      for (let k = 0; k < 4; k++) seed[i * 4 + k] = Math.random();
      const r = Math.random();
      // 0: ince sis, 1: parlayan damlacık, 2: yavaş açılan bulut
      kind[i] = r < 0.2 ? 1 : r < 0.27 ? 2 : 0;
    }
    g.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 4));
    g.setAttribute("aKind", new BufferAttribute(kind, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          u_time: { value: 0 },
          u_t0: { value: -100 },
          u_origin: { value: new Vector3() },
          u_dir: { value: new Vector3(0, 0, 1) },
          u_scale: { value: 1 },
          u_px: { value: 800 },
          u_col: { value: new Color(1, 0.9, 0.8) },
          u_emit: { value: SPRAY.emitDur },
        },
        vertexShader: /* glsl */ `
          uniform float u_time;
          uniform float u_t0;
          uniform vec3 u_origin;
          uniform vec3 u_dir;
          uniform float u_scale;
          uniform float u_px;
          uniform float u_emit;
          attribute vec4 aSeed;
          attribute float aKind;
          varying float vAlpha;
          varying float vKind;
          varying float vTw;
          void main() {
            // Doğuş: sıkmanın başında yoğun, sona doğru seyrek.
            float birth = u_t0 + pow(aSeed.x, 1.7) * u_emit * (aKind > 1.5 ? 0.5 : 1.);
            float a = u_time - birth;
            float life = aKind > 1.5 ? 3.6 : aKind > 0.5 ? 1.7 + aSeed.w : 2.4 + aSeed.w * 1.2;
            vKind = aKind;
            if (a < 0. || a > life) {
              gl_Position = vec4(2., 2., 2., 1.);
              gl_PointSize = 0.;
              vAlpha = 0.;
              return;
            }
            // Koni: ağız yönü etrafında rastgele sapma (bulut daha geniş, damlacık biraz daha dağınık).
            vec3 up = abs(u_dir.y) > 0.9 ? vec3(1., 0., 0.) : vec3(0., 1., 0.);
            vec3 t1 = normalize(cross(u_dir, up));
            vec3 t2 = cross(u_dir, t1);
            float ang = aSeed.y * 6.2831;
            float spread = (aKind > 1.5 ? 0.6 : aKind > 0.5 ? 0.3 : 0.2) * sqrt(aSeed.z);
            vec3 d = normalize(u_dir + (t1 * cos(ang) + t2 * sin(ang)) * spread);
            float speed = (aKind > 1.5 ? 7. + 9. * aSeed.w : 13. + 15. * aSeed.w) * u_scale;
            float k = aKind > 1.5 ? 1.6 : 2.8;
            vec3 p = u_origin + d * speed * (1. - exp(-k * a)) / k;
            // Sis yavaşça yükselir ve kıvrılır; damlacıklar hafifçe süzülüp düşer.
            float sw = aSeed.z * 40.;
            p += vec3(sin(a * 1.7 + sw), 0., cos(a * 1.3 + sw)) * 0.18 * a * u_scale;
            p.y += (aKind > 0.5 && aKind < 1.5 ? -0.12 : 0.22) * a * a * u_scale;
            vec4 mv = modelViewMatrix * vec4(p, 1.);
            gl_Position = projectionMatrix * mv;
            float wsz = aKind > 1.5 ? (0.5 + 2.6 * a) : aKind > 0.5 ? 0.05 + 0.04 * aSeed.w : (0.1 + 1.1 * a) * (0.6 + 0.8 * aSeed.w);
            gl_PointSize = min(wsz * u_scale * u_px / max(-mv.z, 0.5), 460.);
            float fadeIn = smoothstep(0., aKind > 1.5 ? 0.35 : 0.06, a);
            float fadeOut = 1. - smoothstep(life * (aKind > 1.5 ? 0.35 : 0.4), life, a);
            // Kameraya çok yaklaşan buğu soluklaşır.
            float nearCam = smoothstep(1.5, 5., -mv.z);
            // Büyüyen buğu aynı ölçüde soluklaşır (üst üste binince beyaz leke olmaz).
            float spreadFade = aKind > 1.5 ? 1. / (1. + 2.2 * a) : aKind > 0.5 ? 1. : 1. / (1. + 1.4 * a);
            vAlpha = fadeIn * fadeOut * nearCam * spreadFade * (aKind > 1.5 ? 0.11 : aKind > 0.5 ? 1. : 0.32);
            vTw = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(u_time * (9. + aSeed.y * 14.) + aSeed.z * 50.), 3.);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 u_col;
          varying float vAlpha;
          varying float vKind;
          varying float vTw;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            vec3 col;
            float a;
            if (vKind > 0.5 && vKind < 1.5) {
              // Parlayan damlacık: keskin çekirdek ve ince yıldız ışıltısı.
              float core = exp(-d * d * 60.);
              float star = exp(-abs(c.x) * 40.) * exp(-abs(c.y) * 7.) + exp(-abs(c.y) * 40.) * exp(-abs(c.x) * 7.);
              a = (core + star * 0.35) * vTw;
              col = mix(u_col, vec3(1., 0.96, 0.88), 0.7);
            } else {
              // Sis ve bulut: yumuşak, kenara doğru eriyen leke.
              a = exp(-d * d * 9.) * (1. - smoothstep(0.35, 0.5, d));
              // Açık (fotoğraflı) zeminde de seçilsin: buğu beyaza yakın.
              col = mix(u_col, vec3(1.), vKind > 1.5 ? 0.55 : 0.75);
            }
            a *= vAlpha;
            gl_FragColor = vec4(col * a, a);
          }
        `,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() / SPRAY_SLOW;
    const U = material.uniforms;
    // Düğmeye basıldı: önceki sıkma bittiyse yenisi başlar.
    if (sceneState.sprayReq >= 0) {
      if (t - sceneState.spray.t0 > SPRAY.end) sceneState.spray = { t0: t, flavor: sceneState.sprayReq };
      sceneState.sprayReq = -1;
    }
    const sp = sceneState.spray;
    // Buğu, başlığa basıldığı anda ağzın o anki konumundan ve yönünden çıkar.
    // (Başlığın konumu bu sıkma sırasında okunduysa; kare hızından bağımsız.)
    if (t - sp.t0 >= SPRAY.emit && U.u_t0.value !== sp.t0 + SPRAY.emit && sceneState.nozzleAt >= sp.t0) {
      U.u_t0.value = sp.t0 + SPRAY.emit;
      U.u_origin.value.copy(sceneState.nozzle);
      U.u_dir.value.copy(sceneState.nozzleDir);
      U.u_scale.value = Math.max(0.5, (sceneState.focus.scale || 2) / 2);
      U.u_col.value.set(flavors[sp.flavor]?.theme?.accent ?? "#e8c9a0").lerp(WHITE, 0.2);
    }
    U.u_time.value = t;
    // Dünya boyutunu piksele çeviren katsayı: ekran yüksekliği / (2 · tan(fov/2)).
    U.u_px.value = (size.height * dpr) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
