// Stadium configs. Select with ?s=rams | fb | bjk
// Sides are listed in bowl-angle order: [0°, 90°, 180°, 270°] = [+x end, +z side, −x end, −z side].
// The +z long side is the main stand (VIP box, main facade).
// Dimensions come from OpenStreetMap footprints + Esri satellite imagery (roof opening and outer roof measured).

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));

// Auto block layout: numbering runs clockwise from the centre of the main stand, 100s lower / 200s VIP / 400s upper.
function genLayout(counts) {
  const out = {};
  for (const [lvl, perSide] of Object.entries(counts)) {
    const base = +lvl * 100, sides = [[], [], [], []];
    let n = 0;
    const order = [1, 2, 3, 0];
    for (const s of order) for (let k = 0; k < perSide[s]; k++) sides[s].push(String(base + n++));
    out[lvl] = sides;
  }
  return out;
}
function autoCats(layout, opts = {}) {
  const cat = {};
  for (const [lvl, sides] of Object.entries(layout)) {
    sides.forEach((ids, s) => {
      const long = s === 1 || s === 3, n = ids.length;
      ids.forEach((id, i) => {
        const t = n > 1 ? Math.abs(i - (n - 1) / 2) / ((n - 1) / 2) : 0;
        let c;
        if (+lvl === 1) c = long ? (t < 0.2 ? '1. Kategori' : t < 0.45 ? '2. Kategori' : t < 0.75 ? '3. Kategori' : '4. Kategori') : '7. Kategori';
        else if (+lvl === 2) c = s === 1 ? (t < 0.35 ? 'Delux' : 'Lux') : long ? '4. Kategori' : '7. Kategori';
        else c = long ? (t < 0.5 ? '5. Kategori' : '6. Kategori') : '8. Kategori';
        cat[id] = c;
      });
    });
  }
  if (opts.away) { const { lvl, side, count } = opts.away; layout[lvl][side].slice(0, count).forEach((id) => (cat[id] = 'Misafir')); }
  return cat;
}

/* ---------------------------------------------------------------- RAMS Park */
const ramsLayout = {
  1: [range(117, 122), ['123', '124', '125', '125V', '100', '101V', '101', '102', '103'], range(104, 109), range(110, 116)],
  2: [range(217, 222), ['223', '224', '225', '200', '201', '202', '203'], range(204, 209), range(210, 216)],
  4: [range(419, 426), ['427', '428', '429', '400', '401', '402', '403'], range(404, 411), range(412, 418)],
};
const ramsCats = {};
const setCat = (ids, c) => ids.forEach((i) => (ramsCats[i] = c));
setCat(['213'], 'Premium'); setCat(['212', '214', '201', '225'], 'Delux'); setCat(['211', '215', '202', '224'], 'Lux');
setCat(['101V', '100', '125V'], 'Classic'); setCat(['113'], '1. Kategori'); setCat(['112', '114', '101', '125'], '2. Kategori');
setCat(['111', '115', '102', '124'], '3. Kategori'); setCat(['110', '116', '103', '123', '210', '216', '203', '223'], '4. Kategori');
setCat(['413', '414', '415', '416', '417', '402', '401', '400', '429', '428'], '5. Kategori'); setCat(['412', '403', '427'], '6. Kategori');
setCat([...range(104, 109), ...range(117, 122), ...range(204, 209), ...range(217, 222)], '7. Kategori');
setCat([...range(404, 411), ...range(422, 426)], '8. Kategori'); setCat(range(418, 421), 'Misafir'); setCat(['200'], 'Protokol');

const fbLayout = genLayout({ 1: [6, 9, 6, 9], 2: [5, 7, 5, 7], 4: [6, 8, 6, 8] });
const bjkLayout = genLayout({ 1: [6, 9, 6, 9], 2: [5, 7, 5, 7], 4: [6, 8, 6, 8] });

const _S = {
  rams: {
    id: 'rams', stadium: 'RAMS Park', place: 'Seyrantepe', brand: 'ASLAN BİLET',
    colors: { primary: '#a90432', primary2: '#d0103a', accent: '#fdb912' },
    match: { home: 'GALATASARAY', away: 'FENERBAHÇE', short: 'GS  0 – 0  FB', league: 'Süper Lig · Derbi', time: '20:00' },
    geo: { A0: 8.2, B0: 6.2, SEN: 4.2, KA: 0.96, KB: 1.06, facadeD: 57.5, roofY: 46.5, open: { x: 57, z: 42, shape: 'rect' } },
    tiers: [
      { lvl: 1, name: 'Alt Kat', rows: 37, d0: 0.8, depth: 0.78, h0: 0.6, riseA: 0.27, riseB: 0.47 },
      { lvl: 2, name: 'VIP & Loca', rows: 3, d0: 31.0, depth: 0.95, h0: 16.8, riseA: 0.42, riseB: 0.42 },
      { lvl: 4, name: 'Üst Kat', rows: 27, d0: 36.6, depth: 0.72, h0: 23.2, riseA: 0.5, riseB: 0.56 },
    ],
    stands: [{ name: 'Güney', gate: 'D' }, { name: 'Batı', gate: 'A' }, { name: 'Kuzey', gate: 'B' }, { name: 'Doğu', gate: 'C' }],
    layout: ramsLayout, cats: ramsCats,
    seatColor: { 1: 0xc0181e, 2: 0xa3141b, 4: 0xc0181e },
    mosaic: { side: 3, tier: 1, text: 'GALATASARAY', color: '#f2a21c', crest: 'assets/gs-crest.png' },
    ribbon: { bg: '#b8102a', fg: '#ffffff', dot: '#fdb912', words: ['≡RAMS PARK', 'GALATASARAY', '≡RAMS PARK', 'CİMBOM'] },
    led: ['RAMS PARK', 'ASLAN BİLET', '3D KOLTUK SEÇİMİ', 'CİMBOM'],
    sat: { prefix: 'sat', centre: [-3.6, 0.6], axisDeg: 233 },
    roof: { style: 'solar' },
    facade: { style: 'rams', signs: [{ text: '≡RAMS PARK', color: '#ffffff', at: 'main' }, { text: 'GALATASARAY SPOR KULÜBÜ', color: '#f5b21c', glow: true, at: 'mainLeft' }, { text: '≡RAMS PARK', color: '#ffffff', at: 'back' }] },
  },

  /* ------------------------------------------- Chobani Stadyumu Fenerbahçe Şükrü Saracoğlu */
  fb: {
    id: 'fb', stadium: 'Şükrü Saracoğlu', place: 'Kadıköy', brand: 'KANARYA BİLET',
    colors: { primary: '#0b1f5c', primary2: '#1a3a9a', accent: '#ffd200' },
    match: { home: 'FENERBAHÇE', away: 'GALATASARAY', short: 'FB  0 – 0  GS', league: 'Süper Lig · Derbi', time: '20:00' },
    // roof 199 x 162 m, opening 121 x 84 m; boxy bowl with chamfered corners
    geo: { A0: 7.0, B0: 6.0, SEN: 7.0, KA: 1.0, KB: 1.02, facadeD: 40.0, roofY: 33.5, open: { x: 60.5, z: 42, shape: 'rect' } },
    tiers: [
      { lvl: 1, name: 'Alt Kat', rows: 28, d0: 0.8, depth: 0.76, h0: 0.8, riseA: 0.33, riseB: 0.47 },
      { lvl: 2, name: 'Loca Katı', rows: 2, d0: 23.4, depth: 0.95, h0: 13.6, riseA: 0.42, riseB: 0.42 },
      { lvl: 4, name: 'Üst Kat', rows: 17, d0: 28.0, depth: 0.7, h0: 18.6, riseA: 0.55, riseB: 0.62 },
    ],
    stands: [{ name: 'Güney', gate: 'G' }, { name: 'Maraton', gate: 'M' }, { name: 'Kuzey', gate: 'K' }, { name: 'Fenerium', gate: 'F' }],
    layout: fbLayout, cats: autoCats(fbLayout, { away: { lvl: 4, side: 0, count: 3 } }),
    seatW: 0.52, ledAlt: '#3d6bff',
    seatColor: { 1: 0xffc600, 2: 0x10245e, 4: 0x10245e },
    mosaic: { side: 2, tier: 4, text: 'FENERBAHÇE', color: '#ffc600', crest: null, year: '1907' },
    ribbon: { bg: '#0b1f5c', fg: '#ffd200', dot: '#ffffff', words: ['ŞÜKRÜ SARACOĞLU', 'FENERBAHÇE', 'KADIKÖY', '1907'] },
    led: ['ŞÜKRÜ SARACOĞLU', 'KANARYA BİLET', '3D KOLTUK SEÇİMİ', 'FENERBAHÇE'],
    sat: { prefix: 'sat-fb', centre: [6.8, 15.0], axisDeg: 295 },
    sketchfab: { id: '67602830cbd54d4799e76a6931c5d150', title: 'Şükrü Saraçoglu Stadium 3D', author: 'mustafasahinfb', url: 'https://sketchfab.com/3d-models/sukru-saracoglu-stadium-3d-67602830cbd54d4799e76a6931c5d150', authorUrl: 'https://sketchfab.com/mustafasahinfb' },
    roof: { style: 'membrane', texts: [{ text: 'MUSTAFA KEMAL', side: 3 }, { text: 'ATATÜRK', side: 1 }] },
    facade: { style: 'modern', base: '#c9ccd2', band: '#13234f', accent: '#ffd200', signs: [{ text: 'ŞÜKRÜ SARACOĞLU', color: '#ffffff', at: 'main' }, { text: 'FENERBAHÇE', color: '#ffd200', glow: true, at: 'mainLeft' }, { text: 'FENERBAHÇE', color: '#ffd200', at: 'back' }] },
  },

  /* ------------------------------------------- Tüpraş Stadyumu */
  bjk: {
    id: 'bjk', stadium: 'Tüpraş Stadyumu', place: 'Dolmabahçe', brand: 'KARTAL BİLET',
    colors: { primary: '#111114', primary2: '#2b2b31', accent: '#ffffff' },
    match: { home: 'BEŞİKTAŞ', away: 'FENERBAHÇE', short: 'BJK  0 – 0  FB', league: 'Süper Lig · Derbi', time: '20:00' },
    // roof 207 x 154 m, opening 118 x 77 m (oval)
    geo: { A0: 7.5, B0: 6.5, SEN: 3.0, KA: 1.0, KB: 0.86, facadeD: 43.0, roofY: 35.5, open: { x: 59, z: 38.5, shape: 'ellipse' } },
    tiers: [
      { lvl: 1, name: 'Alt Kat', rows: 29, d0: 0.8, depth: 0.76, h0: 0.8, riseA: 0.32, riseB: 0.46 },
      { lvl: 2, name: 'Loca Katı', rows: 2, d0: 24.2, depth: 0.95, h0: 13.8, riseA: 0.42, riseB: 0.42 },
      { lvl: 4, name: 'Üst Kat', rows: 18, d0: 28.8, depth: 0.72, h0: 19.4, riseA: 0.55, riseB: 0.62 },
    ],
    stands: [{ name: 'Güney Kale Arkası', gate: 'G' }, { name: 'Numaralı', gate: 'N' }, { name: 'Kuzey Kale Arkası', gate: 'K' }, { name: 'Kapalı', gate: 'P' }],
    layout: bjkLayout, cats: autoCats(bjkLayout, { away: { lvl: 4, side: 0, count: 4 } }),
    seatW: 0.52, ledAlt: '#e30a17',
    seatColor: { 1: 0x18181b, 2: 0x26262b, 4: 0x18181b },
    mosaic: { side: 3, tier: 1, text: 'BEŞİKTAŞ', color: '#f2f2f2', crest: null, year: '1903' },
    ribbon: { bg: '#0d0d10', fg: '#ffffff', dot: '#e30a17', words: ['TÜPRAŞ STADYUMU', 'BEŞİKTAŞ', 'KARTAL', '1903'] },
    led: ['TÜPRAŞ STADYUMU', 'KARTAL BİLET', '3D KOLTUK SEÇİMİ', 'BEŞİKTAŞ'],
    sat: { prefix: 'sat-bjk', centre: [2.8, -18.2], axisDeg: 307 },
    roof: { style: 'membrane', texts: [{ text: 'BEŞİKTAŞ', side: 3 }, { text: 'Tüpraş', side: 1, lower: true }], eagle: true },
    facade: { style: 'modern', base: '#d9d4c7', band: '#141418', accent: '#ffffff', arches: true, signs: [{ text: 'TÜPRAŞ STADYUMU', color: '#ffffff', at: 'main' }, { text: 'BEŞİKTAŞ', color: '#ffffff', glow: true, at: 'mainLeft' }, { text: 'BEŞİKTAŞ', color: '#ffffff', at: 'back' }] },
  },
};

// Türk Telekom Arena = RAMS Park's former name: same seating data, geometry from the user's SketchUp model
_S.rams.model = { url: 'assets/models/turktelekom.gltf.json', pitch: [22.7, 9.6, 0.15], rotY: 127 };
_S.rams.sat = { ..._S.rams.sat, shift: [0, 14] };
_S.tta = _S.rams; // old link name
export const STADIUMS = _S;
