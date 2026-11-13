import * as THREE from 'three';

// Kesilmiş meyve fotoğrafını (alfa kanallı) hacimli bir 3B kabartmaya çevirir:
// alfa maskesinin kenara uzaklığından kubbe biçimli bir yükseklik haritası çıkarılır,
// ızgara düzlemin köşe noktaları bu haritaya göre öne itilir. Sonuç ışık alır ve gölge düşürür.
export function reliefGeometry(img, { seg = 48, depth = 0.26 } = {}) {
  const N = 72;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, N, N);
  const px = x.getImageData(0, 0, N, N).data;
  const INF = 1e9;
  const d = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) d[i] = px[i * 4 + 3] > 90 ? INF : 0;
  const at = (xx, yy) => (xx < 0 || yy < 0 || xx >= N || yy >= N ? 0 : d[yy * N + xx]);
  // iki geçişli pah (chamfer) uzaklık dönüşümü
  for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
    const i = y * N + xx;
    if (!d[i]) continue;
    d[i] = Math.min(d[i], at(xx - 1, y) + 1, at(xx, y - 1) + 1, at(xx - 1, y - 1) + 1.414, at(xx + 1, y - 1) + 1.414);
  }
  for (let y = N - 1; y >= 0; y--) for (let xx = N - 1; xx >= 0; xx--) {
    const i = y * N + xx;
    if (!d[i]) continue;
    d[i] = Math.min(d[i], at(xx + 1, y) + 1, at(xx, y + 1) + 1, at(xx + 1, y + 1) + 1.414, at(xx - 1, y + 1) + 1.414);
  }
  let max = 1;
  for (let i = 0; i < N * N; i++) if (d[i] < INF && d[i] > max) max = d[i];
  const H = (u, v) => {
    const fx = u * (N - 1), fy = (1 - v) * (N - 1);
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(N - 1, x0 + 1), y1 = Math.min(N - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    const g = (a, b) => Math.sqrt(Math.min(1, d[b * N + a] / max));
    return (g(x0, y0) * (1 - tx) + g(x1, y0) * tx) * (1 - ty) + (g(x0, y1) * (1 - tx) + g(x1, y1) * tx) * ty;
  };
  const aspect = img.height / img.width;
  const geo = new THREE.PlaneGeometry(1, aspect, seg, Math.max(8, Math.round(seg * aspect)));
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const h = H(uv.getX(i), uv.getY(i));
    p.setZ(i, h * depth * Math.min(1, aspect + 0.2));
  }
  geo.computeVertexNormals();
  return { geo, aspect };
}

const cache = new Map();
const loader = new THREE.TextureLoader();
// görsel → { geo, mat, depthMat } (aynı görsel bir kez işlenir)
export function loadRelief(url, opts) {
  const key = url + JSON.stringify(opts || {});
  if (!cache.has(key)) {
    cache.set(key, new Promise((res) => {
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        const { geo, aspect } = reliefGeometry(tex.image, opts);
        // gerçekçi PBR: dokudan yüzey kabartması; taze meyvede ıslak/parlak cila, kurutulmuşta mat
        const glossy = opts && opts.glossy;
        const mat = new THREE.MeshPhysicalMaterial({
          map: tex, alphaTest: 0.45, side: THREE.DoubleSide,
          bumpMap: tex, bumpScale: glossy ? 2.2 : 3.2,
          roughness: glossy ? 0.38 : 0.82, metalness: 0,
          clearcoat: glossy ? 0.55 : 0, clearcoatRoughness: 0.28,
          sheen: glossy ? 0 : 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color('#ffd0c8'),
          emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.2, envMapIntensity: 0.85,
        });
        const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.45 });
        res({ geo, mat, depthMat, aspect, tex });
      }, undefined, () => res(null));
    }));
  }
  return cache.get(key);
}

// ön plan için bulanık, ışıksız düz görsel
export function loadFlat(url) {
  const key = 'flat:' + url;
  if (!cache.has(key)) {
    cache.set(key, new Promise((res) => {
      loader.load(url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        const aspect = tex.image.height / tex.image.width;
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
        res({ geo: new THREE.PlaneGeometry(1, aspect), mat, aspect });
      }, undefined, () => res(null));
    }));
  }
  return cache.get(key);
}
