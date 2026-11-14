// Hazır gıda kitlerinin 3B modelleri: kapaklı saklama kasası (Mini Mix, Mini Select, 35 servis)
// ve kulplu kova (25 servis). Ön yüzde ürünün gerçek etiketi (fotoğraftan düzeltilerek çıkarıldı) durur.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// alttan daralan gövde: kutunun alt köşelerini içeri çeker
function tapered(w, h, d, r, k) {
  const g = new RoundedBoxGeometry(w, h, d, 4, r);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) + h / 2) / h; // 0 alt, 1 üst
    const s = 1 - k * (1 - t);
    p.setX(i, p.getX(i) * s);
    p.setZ(i, p.getZ(i) * s);
  }
  g.computeVertexNormals();
  return g;
}

// paketlerle aynı sahne alanına sığsın: kasa ve kova geniş olduğu için biraz küçültülür
const SCALE = 0.8;

export function makeKit() {
  const group = new THREE.Group();
  group.scale.setScalar(SCALE);
  const plastic = new THREE.MeshPhysicalMaterial({ color: 0x1a1a1c, roughness: 0.42, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.9 });
  const lidMat = new THREE.MeshPhysicalMaterial({ color: 0x2a2a2d, roughness: 0.38, metalness: 0.05, clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: 0.9 });
  const clipMat = new THREE.MeshPhysicalMaterial({ color: 0xd81f26, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.9, emissive: 0x3a0000 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x222224, roughness: 0.35, metalness: 0.7 });
  const labelMat = new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 0.6, emissive: 0xffffff, emissiveIntensity: 0.32, polygonOffset: true, polygonOffsetFactor: -2 });
  let parts = [];
  let key = '';
  let height = 1;

  function clear() {
    for (const m of parts) { group.remove(m); m.geometry.dispose(); }
    parts = [];
  }
  const add = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    group.add(m); parts.push(m);
    return m;
  };

  function build(md) {
    clear();
    const { type, w, h, d, la } = md;
    const k = type === 'bucket' ? 0.08 : 0.12; // daralma
    const lidH = type === 'bucket' ? 0.11 : 0.075;
    const y0 = -h / 2; // taban
    const bodyH = h - lidH;
    // gövde
    add(tapered(w, bodyH, d, 0.06, k), plastic, 0, y0 + bodyH / 2, 0);
    // üst kenar bandı (kasanın ağzındaki çıkıntı)
    add(new RoundedBoxGeometry(w * 1.035, 0.05, d * 1.035, 3, 0.02), plastic, 0, y0 + bodyH - 0.02, 0);
    // kapak
    add(new RoundedBoxGeometry(w * 1.05, lidH, d * 1.05, 4, Math.min(0.035, lidH / 2 - 0.002)), lidMat, 0, y0 + bodyH + lidH / 2, 0);
    if (type === 'crate') {
      // kapağın üstündeki kabartma
      add(new RoundedBoxGeometry(w * 0.82, 0.03, d * 0.7, 3, 0.012), lidMat, 0, y0 + h + 0.012, 0);
      // yanlardaki kırmızı kilitler
      for (const s of [-1, 1]) add(new RoundedBoxGeometry(0.07, 0.17, d * 0.3, 3, 0.025), clipMat, s * (w * 0.525 + 0.02), y0 + bodyH - 0.01, 0);
      // gövdedeki istif çıkıntıları
      for (const s of [-1, 1]) add(new RoundedBoxGeometry(0.035, bodyH * 0.7, d * 0.62, 2, 0.012), plastic, s * (w / 2 - 0.02), y0 + bodyH * 0.55, 0);
    } else {
      // kova: kulp ve kulp tutturma yuvaları
      for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20).rotateZ(Math.PI / 2), metal, s * (w / 2 + 0.015), y0 + bodyH * 0.8, 0);
      const handle = add(new THREE.TorusGeometry(w / 2 + 0.03, 0.013, 10, 48, Math.PI), metal, 0, y0 + bodyH * 0.8, 0);
      handle.rotation.x = -1.25; // kapağın üzerine yatık
      // kapak kenarı kalın kırmızı bant
      add(new RoundedBoxGeometry(w * 1.07, 0.04, d * 1.07, 3, 0.018), lidMat, 0, y0 + bodyH + 0.015, 0);
    }
    // ön etiket: gövdenin eğik ön yüzüne yapışık
    const lw = w * (type === 'bucket' ? 0.78 : 0.64);
    const lh = lw * la;
    const ly = y0 + bodyH * (type === 'bucket' ? 0.47 : 0.5);
    const tz = (ly - y0) / bodyH; // bu yükseklikteki daralma
    const zf = (d / 2) * (1 - k * (1 - tz)) + 0.004;
    const tilt = Math.atan((k * d / 2) / bodyH);
    const lab = add(new THREE.PlaneGeometry(lw, lh), labelMat, 0, ly, zf);
    lab.rotation.x = tilt;
    lab.castShadow = false;
    // arka yüzde de küçük etiket (döndürünce boş kalmasın)
    const back = add(new THREE.PlaneGeometry(lw * 0.8, lh * 0.8), labelMat, 0, ly, -zf);
    back.rotation.set(-tilt, Math.PI, 0);
    back.castShadow = false;
    height = (h + (type === 'crate' ? 0.03 : 0)) * SCALE;
  }

  return {
    group,
    show(md, tex) {
      const id = JSON.stringify(md);
      if (id !== key) { key = id; build(md); }
      if (tex && labelMat.map !== tex) { labelMat.map = tex; labelMat.emissiveMap = tex; labelMat.needsUpdate = true; }
      lidMat.color.set(md.lid || '#2a2a2d');
      group.visible = true;
    },
    hide() { group.visible = false; },
    height: () => height,
  };
}
