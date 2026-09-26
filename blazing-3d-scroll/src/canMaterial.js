import { Color, MeshPhysicalMaterial } from "three";
import { noise } from "./Noise";

// Kutunun gövde malzemesi. Orijinal dokudaki siyah zemin tat rengine,
// açık renkli yazılar `ink` rengine boyanır. İki renk arasında Codrops
// projesindeki gürültülü dikey geçiş (u_progress 0.5 → 1) çalışır.
export function createCanUniforms(flavor) {
  return {
    u_time: { value: 0 },
    u_color1: { value: new Color(flavor.color) },
    u_color2: { value: new Color(flavor.color) },
    u_ink1: { value: new Color(flavor.ink) },
    u_ink2: { value: new Color(flavor.ink) },
    u_progress: { value: 0.5 },
    u_width: { value: 0.8 },
    u_scaleX: { value: 50 },
    u_scaleY: { value: 50 },
  };
}

export function setCanFlavor(uniforms, flavor) {
  uniforms.u_color1.value.set(flavor.color);
  uniforms.u_color2.value.set(flavor.color);
  uniforms.u_ink1.value.set(flavor.ink);
  uniforms.u_ink2.value.set(flavor.ink);
  uniforms.u_progress.value = 0.5;
}

// Modelin dokularını vernikli (clearcoat) bir malzemeye taşır; kutular
// referanstaki gibi keskin beyaz parlamalar alır.
export function createCanMaterial(base, uniforms) {
  const material = new MeshPhysicalMaterial({
    map: base.map,
    normalMap: base.normalMap,
    normalScale: base.normalScale,
    aoMap: base.aoMap,
    metalnessMap: base.metalnessMap,
    roughnessMap: base.roughnessMap,
    side: base.side,
    metalness: 0.45,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  });

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
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_ink1;
        uniform vec3 u_ink2;
        uniform float u_progress;
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
        #include <map_fragment>

        float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        float inkMask = smoothstep(0.04, 0.3, lum);

        float dt = parabola(u_progress, 1.);
        float n = 0.5 * (cnoise(vec4(vCanUv.x * u_scaleX + 0.5 * u_time / 3., vCanUv.y * u_scaleY, 0.5 * u_time / 3., 0.)) + 1.);
        float w = u_width * dt;
        float maskValue = smoothstep(1. - w, 1., vCanUv.y + mix(-w / 2., 1. - w / 2., u_progress));
        maskValue += maskValue * n;
        float mask = smoothstep(1., 1.01, maskValue);

        vec3 body = mix(u_color1, u_color2, mask);
        vec3 ink = mix(u_ink1, u_ink2, mask);
        diffuseColor.rgb = mix(body, ink, inkMask);
      `
    );
  };
  material.customProgramCacheKey = () => "blazing-can";
  return material;
}
