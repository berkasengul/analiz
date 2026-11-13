import * as THREE from 'three';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// tekrarlanabilir değer gürültüsü + fBm
function makeNoise(seed) {
  const r = rng(seed);
  const P = 256;
  const g = new Float32Array(P * P);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const s = (t) => t * t * (3 - 2 * t);
  const v = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = g[((yi & 255) * P) + (xi & 255)], b = g[((yi & 255) * P) + ((xi + 1) & 255)];
    const c = g[(((yi + 1) & 255) * P) + (xi & 255)], d = g[(((yi + 1) & 255) * P) + ((xi + 1) & 255)];
    const u = s(xf), w = s(yf);
    return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
  };
  return (x, y, oct = 5) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let o = 0; o < oct; o++) { sum += v(x * f, y * f) * amp; f *= 2.03; amp *= 0.5; }
    return sum;
  };
}

// taş yüzeyi: renk + normal haritası (yükseklikten Sobel ile)
export function stoneTextures(size = 512) {
  const n = makeNoise(11);
  const n2 = makeNoise(29);
  const h = new Float32Array(size * size);
  const colC = document.createElement('canvas');
  colC.width = colC.height = size;
  const cx = colC.getContext('2d');
  const img = cx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size * 4, v = y / size * 4;
      const base = n(u, v, 6);
      const ridge = 1 - Math.abs(n2(u * 1.6, v * 1.6, 4) * 2 - 1); // çatlak çizgileri
      const crack = Math.pow(ridge, 26) * 0.6;
      const fine = n(u * 9, v * 9, 3);
      const height = base * 0.8 + fine * 0.25 - crack * 0.6;
      h[y * size + x] = height;
      // sıcak kahve-taş renk geçişi
      const t = Math.min(1, Math.max(0, base * 1.35 - 0.12));
      let r = 92 + t * 118, g = 60 + t * 82, b = 40 + t * 54;
      const k = 0.82 + fine * 0.35 - crack * 0.55;
      r *= k; g *= k; b *= k;
      // ince kırmızı tozlar (meyve kırıntısı)
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, r); img.data[i + 1] = Math.min(255, g); img.data[i + 2] = Math.min(255, b); img.data[i + 3] = 255;
    }
  }
  cx.putImageData(img, 0, 0);
  const rr = rng(5);
  for (let i = 0; i < 260; i++) {
    cx.fillStyle = `rgba(${150 + rr() * 60},${10 + rr() * 30},${20 + rr() * 30},${0.35 + rr() * 0.4})`;
    cx.beginPath(); cx.arc(rr() * size, rr() * size, 0.6 + rr() * 2.2, 0, Math.PI * 2); cx.fill();
  }
  const norC = document.createElement('canvas');
  norC.width = norC.height = size;
  const nx = norC.getContext('2d');
  const nimg = nx.createImageData(size, size);
  const H = (x, y) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * 3.2;
      const dy = (H(x, y + 1) - H(x, y - 1)) * 3.2;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      nimg.data[i] = (-dx / len * 0.5 + 0.5) * 255;
      nimg.data[i + 1] = (dy / len * 0.5 + 0.5) * 255;
      nimg.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      nimg.data[i + 3] = 255;
    }
  }
  nx.putImageData(nimg, 0, 0);
  const map = new THREE.CanvasTexture(colC);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(norC);
  for (const t of [map, normalMap]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return { map, normalMap };
}

// düzensiz kenarlı, kalın taş/ahşap kaide
export function stoneSlab({ rx = 2.0, rz = 1.25, height = 0.55, seed = 3 } = {}) {
  const r = rng(seed);
  const n = makeNoise(seed + 7);
  const shape = new THREE.Shape();
  const M = 90;
  for (let i = 0; i <= M; i++) {
    const a = (i / M) * Math.PI * 2;
    const k = 1 + (n(Math.cos(a) * 1.6 + 3, Math.sin(a) * 1.6 + 3, 4) - 0.5) * 0.22 + (r() - 0.5) * 0.015;
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * rz * k;
    if (i) shape.lineTo(x, y); else shape.moveTo(x, y);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 3, curveSegments: 4, steps: 3,
  });
  // yanlarda kaba taş yüzeyi
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (z > 0.01 && z < height - 0.01) {
      const d = 1 + (n(x * 2.2 + 9, z * 6 + y, 3) - 0.5) * 0.08;
      p.setX(i, x * d); p.setY(i, y * d);
    }
  }
  geo.rotateX(-Math.PI / 2); // şekil yatay, kalınlık yukarı
  geo.computeVertexNormals();
  const { map, normalMap } = stoneTextures();
  const topMap = map, topNormal = normalMap;
  topMap.repeat.set(1 / 2.2, 1 / 2.2);
  topNormal.repeat.copy(topMap.repeat);
  const sideMap = map.clone(); sideMap.needsUpdate = true; sideMap.repeat.set(1.2, 0.6);
  const sideNormal = normalMap.clone(); sideNormal.needsUpdate = true; sideNormal.repeat.copy(sideMap.repeat);
  const top = new THREE.MeshStandardMaterial({ map: topMap, normalMap: topNormal, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.86, metalness: 0, envMapIntensity: 0.45 });
  const side = new THREE.MeshStandardMaterial({ map: sideMap, normalMap: sideNormal, normalScale: new THREE.Vector2(1.6, 1.6), roughness: 0.92, color: 0xb59a88, envMapIntensity: 0.3 });
  return { geo, materials: [top, side], top: height + 0.07 };
}

/* ---------------- koyu mermer sergileme platformu ---------------- */
// bordo-siyah zemin üzerinde açık damarlar; cilalı yüzey
export function marbleTexture(size = 768, seed = 17) {
  const n = makeNoise(seed), n2 = makeNoise(seed + 5);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  const img = x.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let xx = 0; xx < size; xx++) {
      const u = xx / size * 3, v = y / size * 3;
      const warp = n(u * 1.2, v * 1.2, 5) * 3.2;
      const vein = Math.pow(1 - Math.abs(Math.sin((u * 1.1 + v * 0.55 + warp) * Math.PI)), 18);
      const vein2 = Math.pow(1 - Math.abs(Math.sin((u * 2.6 - v * 1.4 + warp * 1.6) * Math.PI)), 40) * 0.6;
      const cloud = n2(u * 2, v * 2, 4);
      let r = 30 + cloud * 26, g = 9 + cloud * 8, b = 12 + cloud * 9;
      const vv = Math.min(1, vein * 0.85 + vein2);
      r += vv * 150; g += vv * 98; b += vv * 82;
      const i = (y * size + xx) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// iki kademeli yuvarlak kaide (yuvarlatılmış üst kenar)
export function marblePlinth({ R = 2.35, H = 0.55, baseH = 0.18, size = 768 } = {}) {
  const e = 0.07;
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R + 0.16, 0),
    new THREE.Vector2(R + 0.16, baseH - 0.03),
    new THREE.Vector2(R + 0.13, baseH),
    new THREE.Vector2(R, baseH),
    new THREE.Vector2(R, baseH + H - e),
  ];
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(R - e + Math.cos(a) * e, baseH + H - e + Math.sin(a) * e));
  }
  pts.push(new THREE.Vector2(0, baseH + H));
  const geo = new THREE.LatheGeometry(pts, 128);
  const map = marbleTexture(size);
  const sideMap = map.clone(); sideMap.needsUpdate = true; sideMap.repeat.set(3, 0.5);
  const mat = new THREE.MeshPhysicalMaterial({ map: sideMap, roughness: 0.22, metalness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.08, envMapIntensity: 0.9 });
  return { geo, mat, map, top: baseH + H };
}
