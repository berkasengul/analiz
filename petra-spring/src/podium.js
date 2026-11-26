// Gerçekçi sergi kaidesi: cilalı mermer, pahlı üst tabla, altın kakma şerit, geniş taban,
// üstte ürünün temas gölgesi, altta zemine düşen yumuşak gölge.
// Ürün geçişlerinde kaidenin üstünde ışık halkası, yukarı yükselen ışık sütunu ve parıltılar belirir.
import * as THREE from 'three';

const TAU = Math.PI * 2;
export const POD_TOP = 0.025; // kaidenin üst yüzeyi (yerel birim)
export const POD_HEIGHT = 0.6; // üst yüzeyden tabanın altına

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function tex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// açık krem mermer: bulutsu lekeler, yumuşak ve keskin damarlar, ince altın damar
function marble(seed, w = 1024, h = 512) {
  return tex(w, h, (x, W, H) => {
    const r = rng(seed);
    x.fillStyle = '#efe9e1'; x.fillRect(0, 0, W, H);
    // bulutsu ton farkları
    for (let i = 0; i < 26; i++) {
      const cx = r() * W, cy = r() * H, rad = (0.12 + r() * 0.3) * W;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const warm = r() < 0.5;
      g.addColorStop(0, warm ? 'rgba(226,214,198,.32)' : 'rgba(255,255,255,.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
    }
    // damarlar: kıvrımlı rastgele yürüyüş; önce bulanık geniş, sonra ince keskin
    const vein = (blur, width, alpha, col, n) => {
      x.save();
      x.filter = blur ? `blur(${blur}px)` : 'none';
      for (let k = 0; k < n; k++) {
        let px = r() * W, py = r() * H, a = (r() - 0.5) * 1.2 + (r() < 0.5 ? 0 : Math.PI);
        x.beginPath(); x.moveTo(px, py);
        const steps = 60 + r() * 90;
        for (let s = 0; s < steps; s++) {
          a += (r() - 0.5) * 0.5;
          px += Math.cos(a) * 9; py += Math.sin(a) * 5;
          x.lineTo(px, py);
          if (r() < 0.04) { // çatallanma
            x.moveTo(px, py);
            a += (r() - 0.5) * 1.6;
          }
        }
        x.strokeStyle = col.replace('A', (alpha * (0.5 + r() * 0.7)).toFixed(3));
        x.lineWidth = width * (0.6 + r() * 0.8);
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.stroke();
      }
      x.restore();
    };
    vein(9, 12, 0.22, 'rgba(150,142,132,A)', 8);
    vein(2.2, 2.6, 0.5, 'rgba(122,116,110,A)', 12);
    vein(0.7, 1.0, 0.46, 'rgba(104,98,92,A)', 14);
    vein(0.3, 0.6, 0.34, 'rgba(92,88,84,A)', 10);
    vein(0.6, 1.3, 0.6, 'rgba(190,152,84,A)', 5);
    // ince taş dokusu
    const im = x.getImageData(0, 0, W, H), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * 7;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    x.putImageData(im, 0, 0);
  });
}

function radial(stops, size = 256) {
  return tex(size, size, (x, s) => {
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    x.fillStyle = g; x.fillRect(0, 0, s, s);
  });
}

// köşelerde gölgelendirme bozulmasın diye her köşenin iki yanına çok yakın nokta eklenir
function crisp(pts, e = 0.0025) {
  const out = [];
  pts.forEach((p, i) => {
    const a = pts[i - 1], b = pts[i + 1];
    if (a && b) {
      const d1 = p.clone().sub(a).normalize(), d2 = b.clone().sub(p).normalize();
      if (d1.dot(d2) < 0.985) { out.push(p.clone().addScaledVector(d1, -e), p.clone(), p.clone().addScaledVector(d2, e)); return; }
    }
    out.push(p.clone());
  });
  return out;
}

export function makePodium() {
  const group = new THREE.Group();
  const V = (r, y) => new THREE.Vector2(r, y);
  const marbleTex = marble(7);
  marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping;
  const stone = new THREE.MeshPhysicalMaterial({ map: marbleTex, vertexColors: true, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.14, envMapIntensity: 0.38, color: 0xf6f1e9 });
  const stoneTop = new THREE.MeshPhysicalMaterial({ map: marble(19, 1024, 1024), roughness: 0.24, clearcoat: 0.8, clearcoatRoughness: 0.1, envMapIntensity: 0.5, color: 0xf6f3ee });
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc9a35a, metalness: 1, roughness: 0.26, clearcoat: 0.4, envMapIntensity: 1.25, emissive: 0xffc878, emissiveIntensity: 0 });

  // gövde profili (aşağıdan yukarı): pahlı taban, içeri çekilmiş gövde, taşan üst tabla
  const R = 0.715;
  const prof = crisp([
    V(0.0, -0.575), V(0.765, -0.575), V(0.79, -0.563), V(0.8, -0.543), V(0.8, -0.52), V(0.792, -0.505), V(0.77, -0.497),
    V(0.672, -0.497), V(0.66, -0.488), V(0.66, -0.122), V(0.67, -0.114),
    V(0.712, -0.114), V(0.727, -0.105), V(0.734, -0.088), V(0.734, 0.0), V(0.728, 0.015), V(R, POD_TOP),
  ]);
  const SEG = 128;
  const bodyGeo = new THREE.LatheGeometry(prof, SEG, Math.PI);
  // doku, profil boyunca gerçek uzunluğa göre yayılır (damarlar gövdede gerilmesin)
  {
    const L = [0];
    for (let j = 1; j < prof.length; j++) L.push(L[j - 1] + prof[j].distanceTo(prof[j - 1]));
    const uv = bodyGeo.attributes.uv;
    for (let i = 0; i <= SEG; i++) for (let j = 0; j < prof.length; j++) uv.setXY(i * prof.length + j, (i / SEG) * 2, L[j] / 2.1);
    uv.needsUpdate = true;
  }
  // yumuşak ortam gölgesi: üst tablanın altı ve gövdenin dibi biraz koyu
  {
    const pos = bodyGeo.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), r = Math.hypot(pos.getX(i), pos.getZ(i));
      let k = 1;
      if (r < 0.665 && y < -0.11 && y > -0.49) k *= 0.8 + 0.2 * Math.min(1, (-0.11 - y) / 0.12); // tabla altı
      if (r < 0.665 && y < -0.11 && y > -0.49) k *= 0.9 + 0.1 * Math.min(1, (y + 0.49) / 0.1); // taban üstü
      if (y < -0.49) k *= 0.93;
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k;
    }
    bodyGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  const body = new THREE.Mesh(bodyGeo, stone);
  const top = new THREE.Mesh(new THREE.CircleGeometry(R, 128), stoneTop);
  top.rotation.x = -Math.PI / 2; top.position.y = POD_TOP;
  // altın kakma: üst tablanın altında şerit, tabanın üstünde ince çizgi
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.659, 0.659, 0.02, 128, 1, true), gold);
  band.position.y = -0.145;
  const line = new THREE.Mesh(new THREE.TorusGeometry(0.73, 0.0035, 10, 160), gold);
  line.rotation.x = Math.PI / 2; line.position.y = -0.496;
  const rimLine = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.0028, 10, 160), gold);
  rimLine.rotation.x = Math.PI / 2; rimLine.position.y = POD_TOP + 0.0005;
  for (const m of [body, top]) { m.castShadow = true; m.receiveShadow = true; }
  group.add(body, top, band, line, rimLine);

  // ürünün kaide üstündeki temas gölgesi
  const contactMat = new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(40,30,20,.55)'], [0.45, 'rgba(40,30,20,.25)'], [1, 'rgba(40,30,20,0)']]), transparent: true, depthWrite: false, opacity: 1 });
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactMat);
  contact.rotation.x = -Math.PI / 2; contact.position.y = POD_TOP + 0.002;
  contact.renderOrder = 1;
  group.add(contact);
  // zemine düşen gölge (kaide havada durmasın)
  const floorMat = new THREE.MeshBasicMaterial({ map: radial([[0, 'rgba(60,40,30,.42)'], [0.5, 'rgba(60,40,30,.2)'], [1, 'rgba(60,40,30,0)']]), transparent: true, depthWrite: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0.14, -0.576, -0.12);
  floor.renderOrder = -5;
  group.add(floor);

  /* ---- geçiş ışıkları ---- */
  const accent = new THREE.Color('#ffd9a0');
  // üst yüzeyde parlayan ışık halkası
  const portalMat = new THREE.MeshBasicMaterial({
    map: radial([[0, 'rgba(255,255,255,.35)'], [0.55, 'rgba(255,255,255,.18)'], [0.8, 'rgba(255,255,255,.95)'], [0.86, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']], 512),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0, color: accent.clone(),
  });
  const portal = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), portalMat);
  portal.rotation.x = -Math.PI / 2; portal.position.y = POD_TOP + 0.004;
  portal.renderOrder = 2;
  group.add(portal);
  // yukarı yükselen ışık sütunu
  const beamMat = new THREE.MeshBasicMaterial({
    map: tex(128, 256, (x, W, H) => {
      for (let y = 0; y < H; y++) {
        const t = 1 - y / H; // 0 altta
        const g = x.createLinearGradient(0, 0, W, 0);
        const a = Math.pow(1 - t, 1.6) * 0.9;
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, y, W, 1);
      }
    }),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0, color: accent.clone(),
  });
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.6), beamMat);
  beam.position.set(0, POD_TOP + 1.3, -0.05);
  beam.renderOrder = 2;
  group.add(beam);
  // parıltılar
  const SP = 46;
  const spPos = new Float32Array(SP * 3);
  const spData = [];
  const rr = rng(91);
  for (let i = 0; i < SP; i++) spData.push({ a: rr() * TAU, r: 0.15 + rr() * 0.5, ph: rr(), sp: 0.35 + rr() * 0.5, w: rr() * TAU });
  const spGeo = new THREE.BufferGeometry();
  spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const spMat = new THREE.PointsMaterial({
    size: 0.05, map: radial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,240,210,.6)'], [1, 'rgba(255,230,190,0)']], 64),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0, color: accent.clone(),
  });
  const sparks = new THREE.Points(spGeo, spMat);
  sparks.frustumCulled = false;
  sparks.renderOrder = 3;
  group.add(sparks);

  const tmpC = new THREE.Color();
  return {
    group,
    // ölçüm ve tek kare çekim için: kaidenin katı parçaları ve zemin gölgesi
    solids: [body, top, band, line, rimLine],
    floor,
    // ürün tipine göre temas gölgesinin boyu (kaide biriminde)
    setFootprint(w, d) { contact.scale.set(w, d, 1); },
    setContact(v) { contactMat.opacity = v; },
    setAccent(hex) {
      tmpC.set(hex).lerp(new THREE.Color('#ffffff'), 0.55);
      accent.lerp(tmpC, 1);
      portalMat.color.copy(accent); beamMat.color.copy(accent); spMat.color.copy(accent).lerp(new THREE.Color('#fff4dc'), 0.4);
    },
    // g: geçişin parlaklığı (0..1), p: geçişin ilerleyişi (0..1), t: zaman
    fx(g, p, t) {
      portalMat.opacity = g * 0.9;
      portal.visible = g > 0.003;
      portal.scale.setScalar(0.82 + 0.22 * Math.sin(p * Math.PI) + 0.03 * Math.sin(t * 6));
      beamMat.opacity = g * 0.55;
      beam.visible = g > 0.003;
      beam.scale.set(0.9 + 0.2 * g, 0.4 + 0.6 * g, 1);
      beam.position.y = POD_TOP + 1.3 * beam.scale.y;
      gold.emissiveIntensity = g * 0.9;
      spMat.opacity = Math.min(1, g * 1.4);
      sparks.visible = g > 0.003;
      if (sparks.visible) {
        spData.forEach((s, i) => {
          const life = (s.ph + t * s.sp) % 1;
          const rad = s.r * (1 - life * 0.35);
          const a = s.a + t * 0.6 + life * 1.5;
          spPos[i * 3] = Math.cos(a) * rad;
          spPos[i * 3 + 1] = POD_TOP + 0.02 + life * 1.9;
          spPos[i * 3 + 2] = Math.sin(a) * rad * 0.6;
        });
        spGeo.attributes.position.needsUpdate = true;
        spMat.size = 0.045 + 0.02 * Math.sin(t * 9);
      }
    },
  };
}
