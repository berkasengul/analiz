// Dünya koordinatlı (triplanar) doku örneklemesi — kutu geometrilerde UV gerilmesi olmaz.
// Renk, normal, pürüzlülük ve AO aynı projeksiyonu kullanır. Normal haritası "whiteout" karışımıyla dünya uzayına çevrilir.
//
//   applyWorldUV(material, { maps, worldSize, aspect, normalScale, antiTile, colorMul, roughMul, variation, grime, base })
//
// maps:       { color, normal, roughness, ao } — THREE.Texture (renk sRGB, diğerleri doğrusal), RepeatWrapping
// worldSize:  dokunun gerçek boyutu (m). Her yüzeyde aynı ölçek.
// antiTile:   düşük frekanslı gürültüyle karışan ikinci örnekleme oranı (farklı ölçek + döndürme), 0..1
// variation:  plaka varyasyonu şiddeti (0..1). Plaka başına değerler `plateVar` özniteliğinden gelir:
//             vec4(ofsetU, ofsetV, döndür(0|1), rastgele −1..1). InstancedMesh'te InstancedBufferAttribute olabilir.
// grime:      { map (Opacity), opacity, height (m), width (m), edges: [y...] } — kenarların hemen altında dikey akıntı
// base:       { height (m), dark (0..1) } — zemine değen alt kısımda koyulaşma
// tiles:      { size (m), joint (m, derz genişliği), dark (0..1) } — yatay yüzeylerde dünya ızgarasına oturan kare karolar:
//             karo başına ofset / döndürme / ton shader'da karo numarasından üretilir, derz ince ve kenar yumuşatmalı
// Malzemenin önceki onBeforeCompile'ı (ör. pişmiş ışık kancası) korunur ve önce çalışır.
// Ayarlar sonradan material.userData.worldUV.uniforms üzerinden değiştirilebilir.
import * as THREE from 'three';

const MAX_EDGES = 4;

export function plateVarAttribute(geometry, v) {
  const n = geometry.attributes.position.count, a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) a.set(v, i * 4);
  geometry.setAttribute('plateVar', new THREE.BufferAttribute(a, 4));
  return geometry;
}
export function randomPlateVar(rnd = Math.random) {
  return [rnd() * 7.31, rnd() * 5.17, rnd() < .5 ? 0 : 1, rnd() * 2 - 1];
}

// colorMul: sayı (gri çarpan) ya da [r, g, b] (kanal başına, doğrusal uzayda): dokunun ortalama rengini hedef tona çeker
export function colorMulVec(v = 1) {
  return Array.isArray(v) ? new THREE.Vector3(...v) : new THREE.Vector3(v, v, v);
}

// hedef albedo (hex, sRGB) / dokunun doğrusal ortalaması → kanal başına çarpan. Doku ne renkte olursa olsun ortalaması hedefe oturur.
export function albedoMul(avgLinear, hex) {
  const c = new THREE.Color(hex);   // three: hex → doğrusal
  return [c.r / avgLinear[0], c.g / avgLinear[1], c.b / avgLinear[2]];
}

export function applyWorldUV(material, o) {
  const g = o.grime || {}, b = o.base || {};
  const edges = (g.edges || []).slice(0, MAX_EDGES); while (edges.length < MAX_EDGES) edges.push(-1e4);
  const U = {
    tpColor: { value: o.maps.color }, tpNormal: { value: o.maps.normal }, tpRough: { value: o.maps.roughness },
    tpAO: { value: o.maps.ao || null }, tpHasAO: { value: o.maps.ao ? 1 : 0 },
    tpScale: { value: 1 / (o.worldSize || 2) }, tpAspect: { value: o.aspect || 1 },   // doku en/boy (ör. 2048×1024 → 2): dünya ölçeği iki eksende doğru
    tpNormalScale: { value: o.normalScale ?? 1 },
    tpAnti: { value: o.antiTile ?? .3 }, tpColorMul: { value: colorMulVec(o.colorMul) }, tpRoughMul: { value: o.roughMul ?? 1 },
    tpVar: { value: o.variation ?? 1 }, tpTint: { value: o.tint ?? .03 }, tpRoughVar: { value: o.roughVar ?? .05 },
    tpGrime: { value: g.map || null }, tpGrimeOn: { value: g.map ? 1 : 0 }, tpGrimeOpacity: { value: g.opacity ?? .2 },
    tpGrimeH: { value: g.height ?? .55 }, tpGrimeW: { value: g.width ?? 2 }, tpEdges: { value: edges },
    tpBaseH: { value: b.height ?? .25 }, tpBaseDark: { value: b.dark ?? .35 },
    tpTileSize: { value: o.tiles?.size ?? .6 }, tpTileJoint: { value: o.tiles?.joint ?? .003 }, tpTileDark: { value: o.tiles?.dark ?? .5 },
  };
  material.userData.worldUV = { uniforms: U };
  const lite = !!o.lite, tiles = !!o.tiles;
  const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey;
  const hasPrev = prev !== THREE.Material.prototype.onBeforeCompile;
  material.onBeforeCompile = (sh, r) => {
    if (hasPrev) prev.call(material, sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute vec4 plateVar;
varying vec3 vTpPos; varying vec3 vTpNrm; varying vec4 vTpVar;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
{ vec4 tpW = vec4(transformed, 1.0); vec3 tpN = normal;   // öznitelik: her malzeme türünde tanımlı (objectNormal Basic'te yok)
  #ifdef USE_INSTANCING
    tpW = instanceMatrix * tpW; tpN = mat3(instanceMatrix) * tpN;
  #endif
  tpW = modelMatrix * tpW; vTpPos = tpW.xyz; vTpNrm = normalize(mat3(modelMatrix) * tpN); vTpVar = plateVar; }`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vTpPos; varying vec3 vTpNrm; varying vec4 vTpVar;
uniform sampler2D tpColor, tpNormal, tpRough, tpAO, tpGrime;
uniform vec3 tpColorMul;
uniform float tpHasAO, tpScale, tpAspect, tpNormalScale, tpAnti, tpRoughMul, tpVar, tpTint, tpRoughVar;
uniform float tpGrimeOn, tpGrimeOpacity, tpGrimeH, tpGrimeW, tpBaseH, tpBaseDark, tpTileSize, tpTileJoint, tpTileDark;
vec4 tpV;   // etkin plaka/karo değişkenleri (plateVar ya da karo numarasından)
uniform float tpEdges[${MAX_EDGES}];
float tpHash(vec3 p) { p = fract(p * .3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float tpNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(tpHash(i), tpHash(i + vec3(1,0,0)), f.x), mix(tpHash(i + vec3(0,1,0)), tpHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(tpHash(i + vec3(0,0,1)), tpHash(i + vec3(1,0,1)), f.x), mix(tpHash(i + vec3(0,1,1)), tpHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
// bir eksen düzleminde örnekle: plaka ofseti / 180° döndürme + düşük frekanslı ikinci örnekleme (anti-tiling)
// Türevler (gx, gy) dallanmanın DIŞINDA hesaplanır ve textureGrad ile verilir: if içinde texture() çağrısı
// komşu pikseller farklı dala girince yanlış mip seçer (köşelerde / gürültü sınırlarında parlak-bulanık dikiş).
#define TP_TEX(t, u, a, b) textureGrad(t, u, a, b)
void tpSample(vec2 p, vec2 gx, vec2 gy, float k, out vec3 c, out vec2 tn, out float r, out float ao) {
  vec2 tpS = vec2(tpScale, tpScale * tpAspect);
  float flip = (tpV.z > .5 && tpVar > .0) ? -1.0 : 1.0;
  vec2 uv = (p * tpS + tpV.xy * tpVar) * flip, dx = gx * tpS * flip, dy = gy * tpS * flip;
  c = TP_TEX(tpColor, uv, dx, dy).rgb; vec3 n = TP_TEX(tpNormal, uv, dx, dy).xyz * 2.0 - 1.0; tn = n.xy * flip;
  r = TP_TEX(tpRough, uv, dx, dy).g; ao = tpHasAO > .5 ? TP_TEX(tpAO, uv, dx, dy).r : 1.0;
  ${lite ? '' : `if (k > .001) {
    const float a = .6435; mat2 R = mat2(cos(a), sin(a), -sin(a), cos(a));
    vec2 uv2 = R * (p * tpS * .43) + vec2(.37, .71), dx2 = R * (gx * tpS * .43), dy2 = R * (gy * tpS * .43);
    vec3 c2 = TP_TEX(tpColor, uv2, dx2, dy2).rgb; vec2 tn2 = transpose(R) * (TP_TEX(tpNormal, uv2, dx2, dy2).xy * 2.0 - 1.0);
    float r2 = TP_TEX(tpRough, uv2, dx2, dy2).g, ao2 = tpHasAO > .5 ? TP_TEX(tpAO, uv2, dx2, dy2).r : 1.0;
    c = mix(c, c2, k); tn = mix(tn, tn2, k); r = mix(r, r2, k); ao = mix(ao, ao2, k); }`}
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
vec3 tpN = normalize(vTpNrm), tpW = pow(abs(tpN), vec3(4.0)); tpW /= (tpW.x + tpW.y + tpW.z);
float tpK = tpAnti * smoothstep(.25, .75, tpNoise(vTpPos * .35));
vec3 tpDx = dFdx(vTpPos), tpDy = dFdy(vTpPos);   // tek yerde, dallanmadan önce
tpV = vTpVar;
${tiles ? `vec2 tpTc = vTpPos.xz / tpTileSize, tpTid = floor(tpTc); bool tpTileOn = abs(tpN.y) > .5;
if (tpTileOn) { vec3 h = fract(sin(vec3(dot(tpTid, vec2(127.1, 311.7)), dot(tpTid, vec2(269.5, 183.3)), dot(tpTid, vec2(419.2, 371.9)))) * 43758.5453);
  tpV = vec4(h.x * 7.31, h.y * 5.17, step(.5, h.z), fract(h.x * 13.7 + h.y * 3.1) * 2.0 - 1.0); }` : ''}
vec3 tpC = vec3(0.0); vec3 tpNW = vec3(0.0); float tpR = 0.0, tpO = 0.0; vec3 c; vec2 tn; float r, ao;
if (tpW.x > .01) { tpSample(vTpPos.zy, tpDx.zy, tpDy.zy, tpK, c, tn, r, ao); float tz = sqrt(max(0.0, 1.0 - dot(tn, tn))); tn *= tpNormalScale; vec3 t = vec3(tn + tpN.zy, tz * tpN.x);
  tpC += c * tpW.x; tpR += r * tpW.x; tpO += ao * tpW.x; tpNW += t.zyx * tpW.x; }
if (tpW.y > .01) { tpSample(vTpPos.xz, tpDx.xz, tpDy.xz, tpK, c, tn, r, ao); float tz = sqrt(max(0.0, 1.0 - dot(tn, tn))); tn *= tpNormalScale; vec3 t = vec3(tn + tpN.xz, tz * tpN.y);
  tpC += c * tpW.y; tpR += r * tpW.y; tpO += ao * tpW.y; tpNW += t.xzy * tpW.y; }
if (tpW.z > .01) { tpSample(vTpPos.xy, tpDx.xy, tpDy.xy, tpK, c, tn, r, ao); float tz = sqrt(max(0.0, 1.0 - dot(tn, tn))); tn *= tpNormalScale; vec3 t = vec3(tn + tpN.xy, tz * tpN.z);
  tpC += c * tpW.z; tpR += r * tpW.z; tpO += ao * tpW.z; tpNW += t.xyz * tpW.z; }
tpNW = normalize(tpNW);
// plaka varyasyonu: renk ±tint, pürüzlülük ±roughVar
float tpRnd = fract(sin(dot(tpV.xy, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
tpC *= tpColorMul * (1.0 + tpV.w * tpTint * tpVar);
tpR = clamp(tpR * tpRoughMul + tpRnd * tpRoughVar * tpVar, .04, 1.0);
// kir: parapet / saçak kenarlarının hemen altında dikey akıntı (yalnız düşey yüzeyler)
vec2 tpGdx = vec2(tpDx.x + tpDx.z, 2.0 * tpDx.y) / tpGrimeW, tpGdy = vec2(tpDy.x + tpDy.z, 2.0 * tpDy.y) / tpGrimeW;
if (tpGrimeOn > .5 && abs(tpN.y) < .5) { float gm = 0.0;
  for (int i = 0; i < ${MAX_EDGES}; i++) { float d = tpEdges[i] - vTpPos.y;
    if (d > 0.0 && d < tpGrimeH) { float m = textureGrad(tpGrime, vec2((vTpPos.x + vTpPos.z) / tpGrimeW, 1.0 - d / (tpGrimeW * .5)), tpGdx, tpGdy).r;
      gm = max(gm, m * (1.0 - smoothstep(tpGrimeH * .35, tpGrimeH, d))); } }
  float g = gm * tpGrimeOpacity; tpC *= 1.0 - .6 * g; tpR *= 1.0 - .35 * g; }
${tiles ? `// karo derzi: karo kenarına uzaklık (m); piksel ayak izi (fw) derzden genişse koyulaşma kapsama oranıyla azalır (titreşmez)
if (tpTileOn) { vec2 f = abs(fract(tpTc + .5) - .5) * tpTileSize, fw = abs(tpDx.xz) + abs(tpDy.xz) + 1e-5, hj = vec2(tpTileJoint * .5);
  vec2 j2 = (1.0 - smoothstep(hj - fw * .5, hj + fw * .5, f)) * min(vec2(1.0), tpTileJoint / fw);
  float jm = max(j2.x, j2.y); tpC *= 1.0 - tpTileDark * jm; tpR = mix(tpR, 1.0, jm * .6); }` : ''}
// zemine değen alt kısım: AO benzeri koyulaşma
tpC *= 1.0 - tpBaseDark * (1.0 - smoothstep(0.0, tpBaseH, vTpPos.y));
diffuseColor.rgb *= tpC;`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = tpR;')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize((viewMatrix * vec4(tpNW, 0.0)).xyz);')
      .replace('#include <aomap_fragment>', `#include <aomap_fragment>
reflectedLight.indirectDiffuse *= tpO; reflectedLight.indirectSpecular *= mix(1.0, tpO, .5);`);
  };
  material.customProgramCacheKey = () => 'gm-worldUV' + (lite ? '-lite' : '') + (tiles ? '-tiles' : '') + (hasPrev ? '|' + (prevKey?.call(material) || prev.toString().length) : '');
  material.needsUpdate = true;
  return material;
}
