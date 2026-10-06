// Ürün fotoğrafından tarayıcıda 3B şişe (Shopify teması: mağaza sahibinin yüklediği yeni ürün ya da yeni fotoğraf).
// demo-fabrikasi/araclar/shopify-foto.py'nin sade bir karşılığı:
// - zemin: saydam PNG/WebP'de alfa; düz zeminli (stüdyo, beyaz) fotoğrafta kenarlardan zemin rengiyle doldurma;
// - ürün kare tuvale ortalanır; satır satır yarıçap (rows) ve eksen (axis) çıkarılır: CanMesh "photo" biçimi
//   bu profili döndürerek gövdeyi kurar, fotoğraf ön yüze, yumuşatılmış aynası arka yüze sarılır;
// - kart için şeffaf kesit, sahne için baskın renk.
// Zemini karmaşık (sahne, el, masa) fotoğrafta kesit güvenilmez: null döner, vitrin fotoğrafı düz kart gösterir.
const S = 768; // atlasın bir yarısı
const N = 240; // profil satırı (shopify-foto.py ile aynı)

async function load(url) {
  const r = await fetch(url, { mode: "cors", cache: "force-cache" });
  if (!r.ok) throw new Error(`${r.status}`);
  return createImageBitmap(await r.blob());
}

const canvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

// Zemin maskesi (1 = ürün). Saydam görselde alfa; değilse kenarlardan zemin rengine benzeyen pikseller doldurulur.
function maskOf(d, w, h) {
  const n = w * h;
  const m = new Uint8Array(n);
  let clear = 0;
  for (let i = 0; i < n; i++) if (d[i * 4 + 3] < 128) clear++;
  if (clear > n * 0.02) {
    for (let i = 0; i < n; i++) m[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
    m.cut = true; // zaten kesilmiş görsel
    return m;
  }
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1);
  const med = [0, 1, 2].map((c) => {
    const v = border.map((i) => d[i * 4 + c]).sort((a, b) => a - b);
    return v[v.length >> 1];
  });
  const dist = (i, r, g, b) => Math.hypot(d[i * 4] - r, d[i * 4 + 1] - g, d[i * 4 + 2] - b);
  const bgLike = (i) => dist(i, ...med) < 40;
  const seen = new Uint8Array(n);
  const q = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  let edgeBg = 0;
  for (const i of border)
    if (!seen[i] && bgLike(i)) {
      seen[i] = 1;
      q[qt++] = i;
      edgeBg++;
    }
  if (edgeBg < border.length * 0.6) return null; // zemin düz değil
  while (qh < qt) {
    const i = q[qh++];
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j < 0 || j >= n || seen[j]) continue;
      const near = Math.hypot(d[j * 4] - d[i * 4], d[j * 4 + 1] - d[i * 4 + 1], d[j * 4 + 2] - d[i * 4 + 2]);
      if (bgLike(j) || (near < 9 && dist(j, ...med) < 80)) {
        seen[j] = 1;
        q[qt++] = j;
      }
    }
  }
  for (let i = 0; i < n; i++) m[i] = seen[i] ? 0 : 1;
  return m;
}

// En büyük parça kalır (toz, gölge lekesi gider); satırdaki iç boşluklar (saydam cam) doldurulur.
function clean(m, w, h) {
  const lab = new Int32Array(w * h);
  let best = 0;
  let bestN = 0;
  let id = 0;
  const q = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!m[s] || lab[s]) continue;
    id++;
    let qh = 0;
    let qt = 0;
    q[qt++] = s;
    lab[s] = id;
    while (qh < qt) {
      const i = q[qh++];
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
        if (j >= 0 && j < w * h && m[j] && !lab[j]) {
          lab[j] = id;
          q[qt++] = j;
        }
    }
    if (qt > bestN) {
      bestN = qt;
      best = id;
    }
  }
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let l = -1;
    let r = -1;
    for (let x = 0; x < w; x++)
      if (lab[y * w + x] === best) {
        if (l < 0) l = x;
        r = x;
      }
    if (l >= 0) out.fill(1, y * w + l, y * w + r + 1);
  }
  return { m: out, area: bestN };
}

// Profil: gövdenin orta bölümündeki en geniş parçanın ortası eksen; her satırda eksenden iki yana en kısa uzaklık.
function profile(a) {
  const on = (x, y) => a[(y * S + x) * 4 + 3] > 128;
  let top = -1;
  let bot = -1;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x += 2)
      if (on(x, y)) {
        if (top < 0) top = y;
        bot = y;
        break;
      }
  if (top < 0) return null;
  const centers = [];
  for (let y = top + ((bot - top) / 5) | 0; y < bot - (bot - top) / 5; y += 4) {
    let run = 0;
    let bestL = 0;
    let bestR = -1;
    let start = 0;
    for (let x = 0; x <= S; x++) {
      if (x < S && on(x, y)) {
        if (!run) start = x;
        run++;
      } else if (run) {
        if (run > bestR - bestL + 1) {
          bestL = start;
          bestR = x - 1;
        }
        run = 0;
      }
    }
    if (bestR >= bestL) centers.push((bestL + bestR) / 2);
  }
  centers.sort((p, q) => p - q);
  const cx = Math.round(centers.length ? centers[centers.length >> 1] : S / 2);
  const rows = [];
  for (let i = 0; i < N; i++) {
    const y = Math.min(S - 1, Math.floor(((i + 0.5) / N) * S));
    if (!on(cx, y)) {
      rows.push(0);
      continue;
    }
    let l = cx;
    while (l > 0 && on(l - 1, y)) l--;
    let r = cx;
    while (r < S - 1 && on(r + 1, y)) r++;
    rows.push(Math.round((Math.min(cx - l, r - cx) / S) * 1e4) / 1e4);
  }
  return { axis: Math.round((cx / S) * 1e4) / 1e4, rows, top: top / S, bot: (bot + 1) / S };
}

const hex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
const blob = (c, type, q) => new Promise((res) => c.toBlob((b) => res(b ? URL.createObjectURL(b) : null), type, q));

export async function photoTo3D(url) {
  const img = await load(url);
  const k = Math.min(1, 640 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k));
  const h = Math.max(1, Math.round(img.height * k));
  const small = canvas(w, h);
  const sx = small.getContext("2d", { willReadFrequently: true });
  sx.drawImage(img, 0, 0, w, h);
  const d = sx.getImageData(0, 0, w, h).data;
  const raw = maskOf(d, w, h);
  if (!raw) return null;
  const { m, area } = clean(raw, w, h);
  if (area < w * h * 0.04 || area > w * h * 0.9) return null;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  let cr = 0;
  let cg = 0;
  let cb = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (m[y * w + x]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
        const i = (y * w + x) * 4;
        cr += d[i];
        cg += d[i + 1];
        cb += d[i + 2];
      }
  // Düz zeminli fotoğrafta ürün kenara dayanıyorsa (kırpılmış çekim, sahne) şişenin tamamı yok.
  if (!raw.cut && (x0 <= 0 || y0 <= 0 || x1 >= w - 1 || y1 >= h - 1)) return null;
  const mc = canvas(w, h);
  const mx = mc.getContext("2d");
  const md = mx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) md.data[i * 4 + 3] = m[i] * 255;
  mx.putImageData(md, 0, 0);
  // Kare tuval: ürün ortada, uzun kenarı tuvalin %94'ü.
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  const sc = (S * 0.94) / Math.max(bw, bh);
  const dx = (S - bw * sc) / 2;
  const dy = (S - bh * sc) / 2;
  const F = canvas(S, S);
  const fx = F.getContext("2d", { willReadFrequently: true });
  fx.drawImage(img, x0 / k, y0 / k, bw / k, bh / k, dx, dy, bw * sc, bh * sc);
  fx.globalCompositeOperation = "destination-in";
  fx.drawImage(mc, x0, y0, bw, bh, dx, dy, bw * sc, bh * sc);
  fx.globalCompositeOperation = "source-over";
  const shape = profile(fx.getImageData(0, 0, S, S).data);
  if (!shape || shape.rows.filter((r) => r > 0).length < N * 0.2) return null;
  // Atlas: sol yarı ön yüz, sağ yarı arka yüz (yazısı okunmasın diye yumuşatılmış ayna).
  const A = canvas(2 * S, S);
  const ax = A.getContext("2d");
  ax.drawImage(F, 0, 0);
  ax.save();
  ax.translate(2 * S, 0);
  ax.scale(-1, 1);
  ax.filter = "blur(10px) brightness(0.92)";
  ax.drawImage(F, 0, 0);
  ax.restore();
  const n = Math.max(1, area);
  const [r, g, b] = [cr / n, cg / n, cb / n];
  const pad = 0.01;
  const L = (S - bw * sc) / 2 / S;
  const T = (S - bh * sc) / 2 / S;
  return {
    label: await blob(A, "image/webp", 0.9),
    cut: await blob(F, "image/png"),
    color: hex(r, g, b),
    glow: hex(r * 0.45, g * 0.4, b * 0.4),
    drop: hex(r * 0.85 + 30, g * 0.8 + 25, b * 0.75 + 20),
    photo3d: {
      profile: "round",
      zScale: 0.62,
      axis: shape.axis,
      rows: shape.rows,
      outline: [[[L - pad, T - pad], [1 - L + pad, T - pad], [1 - L + pad, 1 - T + pad], [L - pad, 1 - T + pad]]],
    },
  };
}
