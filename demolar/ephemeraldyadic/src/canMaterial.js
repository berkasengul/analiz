import { Color, MeshPhysicalMaterial } from "three";
import { noise } from "./Noise";
import { content } from "./data";

// Etiket yüzeyi: varsayılan parfüm şişesinin altın varaklı parlak etiketi;
// content.json → labelFinish ile değişir (ör. kâğıt etiket: mat, az yansıma).
// Telefon ekranı: küçük ve parlak; ışıklar ve yansımalar burada daha yumuşak tutulur.
export const MOBILE = typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;

// Fotoğraftan yapılan ürünlerde ışığın bir kısmı fotoğrafın kendi rengiyle
// karışır: renk ve arka etiket yazıları gerçek fotoğraftaki gibi net kalır,
// spot ışık yüzeyi beyazlatmaz.
// content.photoUnlit: fotoğrafın kendi ışığının payı (etiketler ışıkta beyazlamasın, yazılar net okunsun).
export const unlitOf = (f) => (f.form === "photo" ? content.photoUnlit ?? (MOBILE ? 0.62 : 0.4) : 0);

const FINISH = { metalness: 0.3, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.1, ...content.labelFinish };

// Kutunun baskı malzemesi. Her tadın kendi tam renkli etiket görseli var
// (`flavor.texture`). Tat değişirken iki etiket arasında Codrops projesindeki
// gürültülü dikey geçiş (u_progress 0.5 → 1) çalışır. u_color1/u_color2
// etiketi parlatmak için çarpan (normalde beyaz = 1).
export function createCanUniforms(flavor) {
  return {
    u_time: { value: 0 },
    u_map1: { value: flavor.texture },
    u_map2: { value: flavor.texture },
    u_color1: { value: new Color(1, 1, 1) },
    u_color2: { value: new Color(1, 1, 1) },
    u_ink1: { value: new Color() },
    u_ink2: { value: new Color() },
    u_progress: { value: 0.5 },
    u_dim: { value: 1 },
    u_unlit: { value: unlitOf(flavor) },
    u_sweep: { value: 0 },
    u_sweepColor: { value: new Color(1, 0.9, 0.7) },
    u_rim: { value: new Color(0, 0, 0) },
    // Tepe ışığı (odaktaki ürün): üstten inen ışık; çarpımsal (renk ve yazı kontrastı korunur, parlama yok).
    u_key: { value: 0 },
    u_keyColor: { value: new Color(1, 0.94, 0.84) },
    u_width: { value: 0.8 },
    u_scaleX: { value: 50 },
    u_scaleY: { value: 50 },
  };
}

export function setCanFlavor(uniforms, flavor) {
  uniforms.u_map1.value = flavor.texture;
  uniforms.u_map2.value = flavor.texture;
  uniforms.u_color1.value.setScalar(1);
  uniforms.u_color2.value.setScalar(1);
  uniforms.u_progress.value = 0.5;
  uniforms.u_unlit.value = unlitOf(flavor);
}

// Cam şişenin içindeki parfüm ve etiket.
export function createCanMaterial(base, uniforms) {
  // content.glass: şeffaf cam şişeler; dokunun alfası yarı saydam camdır, malzeme saydam çizilir.
  const material = new MeshPhysicalMaterial({ map: base.map, alphaTest: content.glass ? 0.02 : 0.5, transparent: !!content.glass, ...FINISH });
  // Sahne her karede yansımayı ve cilayı kısar/açar; oranlar bu değerlere göre.
  material.userData.finish = FINISH;
  // content.photoExact: ürün fotoğrafının renkleri ton eşlemeden geçmez (beyaz etiket gri, altın yazı soluk kalmaz).
  if (content.photoExact) material.toneMapped = false;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vCanUv;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCanUv = uv;");

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      /* glsl */ `
        #include <common>

        uniform float u_time;
        uniform sampler2D u_map1;
        uniform sampler2D u_map2;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform float u_progress;
        uniform float u_dim;
        uniform float u_unlit;
        uniform float u_sweep;
        uniform vec3 u_sweepColor;
        uniform vec3 u_rim;
        uniform float u_key;
        uniform vec3 u_keyColor;
        uniform float u_width;
        uniform float u_scaleX;
        uniform float u_scaleY;

        varying vec2 vCanUv;

        ${noise}

        float parabola(float x, float k) {
          return pow(4. * x * (1. - x), k);
        }
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      /* glsl */ `
        // Gürültü yalnızca geçiş sırasında hesaplanır; durağan kutular ucuz kalır.
        float mask = 0.;
        if (u_progress > 0.501) {
          float dt = parabola(u_progress, 1.);
          float n = 0.5 * (cnoise(vec4(vCanUv.x * u_scaleX + 0.5 * u_time / 3., vCanUv.y * u_scaleY, 0.5 * u_time / 3., 0.)) + 1.);
          float w = u_width * dt;
          float maskValue = smoothstep(1. - w, 1., (1. - vCanUv.y) + mix(-w / 2., 1. - w / 2., u_progress));
          maskValue += maskValue * n;
          mask = smoothstep(1., 1.01, maskValue);
        }

        vec4 t1 = texture2D(u_map1, vCanUv);
        vec4 t2 = texture2D(u_map2, vCanUv);
        diffuseColor.rgb = mix(t1.rgb * u_color1, t2.rgb * u_color2, mask);
        // Fotoğraflı ürünlerde doku alfası ürünün silüetidir (alphaTest ile kesilir).
        diffuseColor.a *= mix(t1.a, t2.a, mask);
      `
    );

    // Kenar parıltısı: kutunun kenarlarında tadın renginde ince bir ışık.
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      /* glsl */ `
        float rimF = pow(1. - abs(dot(normal, normalize(vViewPosition))), 3.);
        // u_dim tüm ışığı (yansımalar dahil) kısar: yan kutular gerçekten kararır.
        outgoingLight = mix(outgoingLight, diffuseColor.rgb, u_unlit) * u_dim + u_rim * rimF * (1. - 0.6 * u_unlit);
        // Tepe ışığı: üst kısım biraz aydınlanır, alt kısım hafif gölgede kalır (çarpımsal: yazılar beyazlamaz);
        // yukarı bakan yüzeylerde (kapak üstü, omuz) sıcak, ince bir parıltı.
        if (u_key > 0.001) {
          float kh = smoothstep(0.08, 0.92, vCanUv.y);
          outgoingLight *= mix(1., mix(0.86, 1.14, kh), u_key);
          outgoingLight += u_keyColor * pow(max(normal.y, 0.), 5.) * 0.16 * u_key;
        }
        // Stüdyo ışık süpürmesi (tema): yüzeyden çapraz, yumuşak bir ışık bandı periyodik geçer.
        if (u_sweep > 0.001) {
          float sx = -vViewPosition.x * 0.85 - vViewPosition.y * 0.5;
          float ph = mod(u_time * 1.6, 14.) - 6.;
          float band = exp(-pow((sx - ph) / 0.55, 2.));
          outgoingLight += u_sweepColor * band * u_sweep * (0.35 + 0.65 * rimF);
        }
        #include <opaque_fragment>
      `
    );
  };
  material.customProgramCacheKey = () => "hope-bottle";
  material.userData.uniforms = uniforms;
  return material;
}
