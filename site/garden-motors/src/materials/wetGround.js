// Islak zemin (yağmur sonrası gece): yol ve kaldırımda düzlem yansıması + su birikintisi + koyulaşma.
// Yansıma görüntüsü sahnedeki tek bir Reflector'dan gelir (görünmez çizilir, yalnız render target'ı kullanılır).
// Malzeme bu görüntüyü kendi dünya konumundan izdüşümle okur, dikey yönde bulanıklaştırır (ıslak asfalttaki uzun ışık süzmeleri),
// Fresnel ile ağırlıklandırıp ışık hesabının sonuna ekler. Pürüzlülük ıslak yerlerde düşer: ışıklar keskin parlar.
//
//   const U = createWetUniforms();  U.wetMap.value = reflector.getRenderTarget().texture;  U.wetTM.value = reflector.material.uniforms.textureMatrix.value;
//   applyWet(material, U, { darken, puddle, minWet });
// Malzemenin önceki onBeforeCompile'ı (ör. worldUV, pişmiş ışık kancası) korunur ve önce çalışır.
import * as THREE from 'three';

export function createWetUniforms(o = {}) {
  return {
    wetMap: { value: null }, wetTM: { value: new THREE.Matrix4() },
    wetOn: { value: 1 },                     // yansıma görüntüsü güncel değilse (akıcı mod / içerideyken) 0
    wetReflect: { value: o.reflect ?? 1 },   // yansıma şiddeti
    wetAmount: { value: o.wetness ?? 1 },    // genel ıslaklık
    wetStreak: { value: o.streak ?? 1 },     // dikey süzülme uzunluğu
  };
}

export function applyWet(material, U, { darken = .4, puddle = .55, minWet = .45, scale = .32 } = {}) {
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey;
  const hasPrev = prev !== THREE.Material.prototype.onBeforeCompile;
  const L = { wetDarken: { value: darken }, wetPuddle: { value: puddle }, wetMin: { value: minWet }, wetScale: { value: scale } };
  material.onBeforeCompile = (sh, r) => {
    if (hasPrev) prev.call(material, sh, r);
    Object.assign(sh.uniforms, U, L);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWetW;')
      .replace('#include <project_vertex>', `#include <project_vertex>
{ vec4 wW = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  wW = instanceMatrix * wW;
#endif
  vWetW = (modelMatrix * wW).xyz; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWetW;
uniform sampler2D wetMap; uniform mat4 wetTM;
uniform float wetOn, wetReflect, wetAmount, wetStreak, wetDarken, wetPuddle, wetMin, wetScale;
float wetH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wetN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wetH(i), wetH(i + vec2(1, 0)), f.x), mix(wetH(i + vec2(0, 1)), wetH(i + vec2(1, 1)), f.x), f.y); }
float wetMask() {   // birikinti: düşük frekanslı gürültü; aralarında nemli (minWet) zemin
  vec2 p = vWetW.xz * wetScale; float n = wetN(p) * .62 + wetN(p * 2.7 + 13.1) * .38;
  return wetAmount * mix(wetMin, 1.0, smoothstep(1.0 - wetPuddle - .08, 1.0 - wetPuddle + .08, n)); }`)
      .replace('#include <lights_physical_fragment>', `float wetM = wetMask();
diffuseColor.rgb *= 1.0 - wetDarken * wetM;                     // ıslak yüzey koyulaşır
roughnessFactor = mix(roughnessFactor, .07, wetM * .9);          // su filmi: ışıklar keskin parlar
#include <lights_physical_fragment>`)
      .replace('#include <opaque_fragment>', `if (wetOn > .5) {
  vec4 wc = wetTM * vec4(vWetW, 1.0); vec2 wuv = wc.xy / wc.w;
  float rip = wetN(vWetW.xz * 7.0) - .5; wuv.x += rip * .004;
  float st = wetStreak * mix(2.4, 1.0, wetM) * .006;           // nemli (birikinti olmayan) yerde daha bulanık
  vec3 rc = vec3(0.0); float ws = 0.0;
  for (int i = -5; i <= 5; i++) { float o = float(i), w = exp(-o * o / 12.0); rc += texture2D(wetMap, wuv + vec2(0.0, o * st)).rgb * w; ws += w; }
  rc /= ws;
  vec3 V = normalize(cameraPosition - vWetW); float fr = .02 + .98 * pow(1.0 - clamp(V.y, 0.0, 1.0), 5.0);
  outgoingLight += rc * fr * wetM * wetReflect;
}
#include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'gm-wet|' + (hasPrev ? (prevKey?.call(material) || prev.toString().length) : '');
  material.needsUpdate = true;
  return material;
}
