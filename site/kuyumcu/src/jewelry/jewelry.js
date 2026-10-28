// Bilgin Kuyumculuk: kodla üretilen mücevher kiti (lisans gerektirmez, her boyutta aynı kalite).
// Birim metre. Gerçek boyutlar: tektaş yüzük ~2 cm, bilezik iç çapı ~6.4 cm, kolye zinciri 45 cm.
// Vitrinde sokaktan okunsun diye `scale` ile büyütülebilir (dev yüzük heykeli, dev pırlanta).
//
//   const J = createJewelryKit(THREE, { env });      // env: parlamalar için stüdyo ortamı (PMREM)
//   J.solitaire({ metal: J.mat.gold22, carat: 1 })   // tektaş
//   J.bangle({ style: 'plain' | 'cut' | 'twist', metal })
//   J.necklace({ metal, length, pendant: 'diamond' | 'coin' | null })
//   J.earrings({ metal }) · J.bust() · J.ringStand() · J.tray({ w, d }) · J.bridalSet({ metal })
//   J.brilliant(r)                                     // pırlanta geometrisi (tek taş)

// mücevher stüdyosu ortamı: koyu oda + birkaç parlak softbox / şerit. Mücevher fotoğrafçılığındaki gibi yüksek kontrast:
// pırlanta fasetleri sırayla siyah / beyaz yansıtır (pırıltı), altın derin ve parlak görünür.
export function jewelryEnv(THREE, renderer, { base = '#26262c' } = {}) {   // base: odanın genel tonu (pırlanta için açık: '#7d828c')
  const sc = new THREE.Scene();
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: base, side: THREE.BackSide })));
  const box = (w, h, x, y, z, c = '#ffffff', k = 6) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); sc.add(m); };
  box(13, 13, 0, 8, 0, '#fff7ec', 3.2);          // geniş üst softbox: pırlantanın masası parlak
  box(1, 7, -7, 2, 1, '#ffffff', 7); box(1, 7, 7, 2, -1, '#ffffff', 7);   // iki yan şerit (altında ve kenarında parlama)
  box(5, 1.2, 0, 1.5, 8, '#fff1dc', 4);          // ön alçak kart
  for (let i = 0; i < 36; i++) {                  // küre üzerine eşit dağılmış küçük parlak kartlar: her yönden bakışta fasetlerde pırıltı
    const y = 1 - (i + .5) / 36 * 2, rr = Math.sqrt(1 - y * y), a = i * 2.39996, R = 8.5;
    box(1.1, 1.1, Math.cos(a) * rr * R, y * R, Math.sin(a) * rr * R, i % 4 ? '#ffffff' : '#ffeedd', 9);
  }
  box(3, .6, -3, -1, -7, '#d9e4ff', 3);           // arkada serin ince şerit (mavi-beyaz ton)
  const pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(sc, 0).texture; pm.dispose();
  sc.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return t;
}

export function createJewelryKit(THREE, { env = null, diamondEnv = null, lowPoly = false } = {}) {
  const seg = (n) => (lowPoly ? Math.max(6, Math.round(n * .5)) : n);
  const metal = (name, color, rough = .16) => {
    const m = new THREE.MeshPhysicalMaterial({ name, color, metalness: 1, roughness: rough, envMap: env, envMapIntensity: 1.6, clearcoat: .35, clearcoatRoughness: .08 });
    m.userData.jewel = true; return m;
  };
  const mat = {
    gold22: metal('J_gold22', '#f2c25a', .14),      // 22 ayar: derin sarı
    gold14: metal('J_gold14', '#e6c07e', .16),      // 14 ayar: daha açık, hafif pembe
    rose: metal('J_rose', '#e9a989', .17),
    silver: metal('J_silver', '#e8ebee', .12),
    // pırlanta: kırılım yerine yönlü fasetler + çok parlak ortam yansıması + ince gökkuşağı (iridescence) → ışıkta "ateş"
    // pırlanta: ayna gibi fasetler (her faset ortamın başka bir yerini yansıtır → siyah / beyaz pırıltı) + ince gökkuşağı (ateş)
    diamond: new THREE.MeshPhysicalMaterial({ name: 'J_diamond', color: '#f2f6ff', metalness: 1, roughness: 0, envMap: diamondEnv || env, envMapIntensity: 2.2,
      iridescence: .7, iridescenceIOR: 2.0, iridescenceThicknessRange: [250, 800], flatShading: true }),
    velvet: new THREE.MeshPhysicalMaterial({ name: 'J_velvet', color: '#14161c', roughness: .95, sheen: 1, sheenRoughness: .45, sheenColor: new THREE.Color('#4a5266') }),
    velvetCream: new THREE.MeshPhysicalMaterial({ name: 'J_velvetCream', color: '#d9cdb8', roughness: .92, sheen: 1, sheenRoughness: .5, sheenColor: new THREE.Color('#fff4e0') }),
    lacquer: new THREE.MeshPhysicalMaterial({ name: 'J_lacquer', color: '#0d0e10', metalness: .1, roughness: .25, clearcoat: 1, clearcoatRoughness: .05, envMap: env, envMapIntensity: .8 }),
  };
  mat.diamond.userData.jewel = true;

  // ---- pırlanta (yuvarlak, 57 faset görünümü): masa, taç (yıldız + uçurtma), kuşak, köşk. r = kuşak yarıçapı.
  // Oranlar ideal kesime yakın: masa %55, taç 0.16 r, kuşak 0.03 r, köşk 0.43 r.
  const brilliantCache = new Map();
  function brilliantGeo(r = .005) {
    const key = r.toFixed(5) + (lowPoly ? 'l' : '');
    if (brilliantCache.has(key)) return brilliantCache.get(key);
    const N = lowPoly ? 8 : 16, pos = [];
    const P = (rad, a, y) => [rad * r * Math.cos(a), y * r, rad * r * Math.sin(a)];
    const tri = (a, b, c) => pos.push(...a, ...b, ...c);
    const T = .55, yT = .19, yS = .14, yG = .03, yB = 0, yP = -.2, yC = -.43;
    for (let i = 0; i < N; i++) {
      const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, am = (a0 + a1) / 2;
      const t0 = P(T, a0, yT), t1 = P(T, a1, yT), c = P(0, 0, yT);
      tri(c, t1, t0);                                                      // masa (üçgen dilimler: düz yüzey)
      const s = P(.8, am, yS), g0 = P(1, a0, yG), g1 = P(1, a1, yG), gm = P(1, am, yG);
      tri(t0, t1, s); tri(t0, s, g0); tri(s, g1, gm); tri(s, gm, g0); tri(t1, g1, s);   // yıldız + uçurtma + üst kuşak fasetleri
      const b0 = P(1, a0, yB), b1 = P(1, a1, yB), bm = P(1, am, yB);
      tri(g0, gm, bm); tri(g0, bm, b0); tri(gm, g1, b1); tri(gm, b1, bm);  // kuşak
      const p = P(.42, am, yP), cul = P(0, 0, yC);
      tri(b0, bm, p); tri(bm, b1, p); tri(b0, p, cul); tri(p, b1, cul);    // köşk (alt kuşak + ana fasetler)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    brilliantCache.set(key, g); return g;
  }
  const brilliant = (r, m = mat.diamond) => { const d = new THREE.Mesh(brilliantGeo(r), m); d.name = 'J_pırlanta'; return d; };

  // ---- tektaş yüzük: halka (hafif bombeli kesit) + 4 tırnaklı kafa + pırlanta. carat → taş çapı (1 ct ≈ 6.5 mm)
  function solitaire({ metal: m = mat.gold14, carat = 1, size = .0085 } = {}) {
    const g = new THREE.Group(); g.name = 'J_tektaş';
    const band = new THREE.Mesh(new THREE.TorusGeometry(size + .0011, .0011, seg(16), seg(96)), m);
    band.scale.set(1, 1, 1.25); g.add(band);                              // halka genişliği > kalınlık
    const dr = .00325 * Math.cbrt(carat), top = size + .0022;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(dr * .55, dr * .3, .0028, seg(16)), m); head.position.y = top + .0006; g.add(head);
    const d = brilliant(dr); d.position.y = top + .0022 + dr * .43; g.add(d);
    for (let k = 0; k < 4; k++) {                                         // tırnaklar
      const a = k / 4 * Math.PI * 2 + Math.PI / 4, pr = new THREE.Mesh(new THREE.CylinderGeometry(.00028, .00036, dr * .95, 8), m);
      pr.position.set(Math.cos(a) * dr * .93, top + .0018 + dr * .36, Math.sin(a) * dr * .93); pr.lookAt(0, top + dr * .9, 0); pr.rotateX(Math.PI / 2); g.add(pr);
    }
    g.userData.diamond = d; return g;
  }

  // ---- bilezik: düz (bombeli), elmas kesim (fasetli), burma (iki telin sarılması)
  function bangle({ style = 'plain', metal: m = mat.gold22, r = .033 } = {}) {
    const g = new THREE.Group(); g.name = 'J_bilezik_' + style;
    if (style === 'twist') {
      const c = new THREE.Curve(); c.getPoint = (t, v = new THREE.Vector3()) => v.set(Math.cos(t * 2 * Math.PI) * r, 0, Math.sin(t * 2 * Math.PI) * r);
      for (const ph of [0, Math.PI]) {
        const h = new THREE.Curve(); h.getPoint = (t, v = new THREE.Vector3()) => {
          const a = t * 2 * Math.PI, w = a * 22 + ph, rr = r + Math.cos(w) * .0016;
          return v.set(Math.cos(a) * rr, Math.sin(w) * .0016, Math.sin(a) * rr); };
        g.add(new THREE.Mesh(new THREE.TubeGeometry(h, seg(480), .0017, seg(10), true), m));
      }
    } else {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, .0032, style === 'cut' ? 6 : seg(20), seg(style === 'cut' ? 48 : 128)), style === 'cut' ? Object.assign(m.clone(), { flatShading: true }) : m);
      t.scale.set(1, 1, .7); t.rotation.x = Math.PI / 2; g.add(t);
    }
    return g;
  }

  // ---- kolye: zincir (birbirine dik halkalar, örneklenmiş) + kolye ucu. Zincir V/U eğrisi boyunca dizilir.
  function necklace({ metal: m = mat.gold22, length = .45, pendant = 'diamond', curve = null, link = .0028 } = {}) {
    const g = new THREE.Group(); g.name = 'J_kolye';
    const cv = curve || new THREE.CatmullRomCurve3([new THREE.Vector3(-.075, .06, -.02), new THREE.Vector3(-.06, 0, .01), new THREE.Vector3(0, -.075, .045),
      new THREE.Vector3(.06, 0, .01), new THREE.Vector3(.075, .06, -.02)]);
    const L = cv.getLength(), n = Math.max(20, Math.floor(L / (link * .82)));
    const lg = new THREE.TorusGeometry(link * .5, link * .12, 6, 12); lg.scale(1, .62, 1);
    const im = new THREE.InstancedMesh(lg, m, n), q = new THREE.Quaternion(), mx = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0), tg = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = cv.getPointAt(t); cv.getTangentAt(t, tg);
      q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tg); if (i % 2) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2));
      im.setMatrixAt(i, mx.compose(p, q, new THREE.Vector3(1, 1, 1)));
    }
    im.instanceMatrix.needsUpdate = true; g.add(im);
    const low = cv.getPointAt(.5);
    if (pendant === 'diamond') {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.0046, .0006, 8, 32), m); halo.position.copy(low).add(new THREE.Vector3(0, -.006, .001)); g.add(halo);
      const d = brilliant(.0042); d.rotation.x = Math.PI / 2; d.position.copy(halo.position).add(new THREE.Vector3(0, 0, .0012)); g.add(d);
    } else if (pendant === 'coin') {                                       // çeyrek / yarım altın görünümlü madalyon
      const c = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .0012, seg(48)), m); c.rotation.x = Math.PI / 2; c.position.copy(low).add(new THREE.Vector3(0, -.013, .001)); g.add(c);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(.011, .0008, 8, seg(48)), m); rim.position.copy(c.position); g.add(rim);
    }
    return g;
  }

  // ---- küpe çifti: sallantılı pırlanta damla
  function earrings({ metal: m = mat.gold14, gap = .05 } = {}) {
    const g = new THREE.Group(); g.name = 'J_küpe';
    for (const sd of [-1, 1]) {
      const e = new THREE.Group(); e.position.x = sd * gap / 2;
      const hook = new THREE.Mesh(new THREE.TorusGeometry(.004, .0005, 8, 24, Math.PI * 1.2), m); hook.rotation.z = Math.PI * .4; hook.position.y = .016; e.add(hook);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.0004, .0004, .012, 6), m); bar.position.y = .008; e.add(bar);
      const d = brilliant(.0032); d.rotation.x = Math.PI; d.position.y = .0005; e.add(d);
      const small = brilliant(.0016); small.position.y = .0125; e.add(small);
      g.add(e);
    }
    return g;
  }

  // ---- sergileme: kolye büstü (kadife), yüzük konisi, kadife tepsi, kutu
  function bust({ m = mat.velvet, h = .34 } = {}) {
    const pts = [[0, 0], [.125, 0], [.13, .012], [.124, .04], [.104, .075], [.066, .1], [.047, .125], [.04, .2], [.041, .262], [.03, .272], [.0, .274]].map(([x, y]) => new THREE.Vector2(x * h / .34, y * h / .34));
    const b = new THREE.Mesh(new THREE.LatheGeometry(pts, seg(48)), m); b.scale.set(1.3, 1, .52); b.name = 'J_büst'; return b;
  }
  function ringStand({ m = mat.velvet } = {}) {
    const g = new THREE.Group(); g.name = 'J_yüzük_konisi';
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.006, .013, .06, seg(32)), m); c.position.y = .03; g.add(c);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.02, .022, .006, seg(32)), mat.lacquer); base.position.y = .003; g.add(base);
    g.userData.ringY = .045; return g;
  }
  function tray({ w = .3, d = .2, m = mat.velvet } = {}) {
    const g = new THREE.Group(); g.name = 'J_tepsi';
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, .012, d), mat.lacquer); b.position.y = .006; g.add(b);
    const v = new THREE.Mesh(new THREE.BoxGeometry(w - .016, .002, d - .016), m); v.position.y = .013; g.add(v);
    return g;
  }
  // ---- gelin seti: kolye + küpe + bilezik + yüzük, açık kadife kutuda
  function bridalSet({ metal: m = mat.gold22 } = {}) {
    const g = new THREE.Group(); g.name = 'J_gelin_seti';
    const box = tray({ w: .26, d: .2, m: mat.velvetCream }); g.add(box);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .012), mat.lacquer); lid.position.set(0, .1, -.1); lid.rotation.x = -.18; g.add(lid);
    const lidV = new THREE.Mesh(new THREE.PlaneGeometry(.244, .184), mat.velvetCream); lidV.position.set(0, .1, -.092); lidV.rotation.x = -.18; g.add(lidV);
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(-.085, .015, -.06), new THREE.Vector3(-.07, .015, .0), new THREE.Vector3(0, .015, .055),
      new THREE.Vector3(.07, .015, .0), new THREE.Vector3(.085, .015, -.06)]);
    const n = necklace({ metal: m, curve: cv, pendant: 'coin' }); g.add(n);
    const e = earrings({ metal: m, gap: .07 }); e.rotation.x = -Math.PI / 2; e.position.set(0, .016, -.02); g.add(e);
    const b = bangle({ style: 'cut', metal: m, r: .028 }); b.rotation.x = Math.PI / 2; b.scale.setScalar(.8); b.position.set(-.075, .02, .06); b.rotation.set(0, 0, 0); g.add(b);
    const r = solitaire({ metal: m, carat: .5 }); r.position.set(.08, .024, .065); r.rotation.x = -.5; g.add(r);
    return g;
  }

  return { mat, brilliant, brilliantGeo, solitaire, bangle, necklace, earrings, bust, ringStand, tray, bridalSet };
}
