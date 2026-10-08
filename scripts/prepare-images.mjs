// npm run images — ürün fotoğraflarını indirir, arka planı siler, kırpar,
// public/products/<id>.png + <id>.json (şişe profili) üretir; logoyu hazırlar.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/products');
const brandDir = path.join(root, 'public/brand');
const cacheDir = path.join(root, 'node_modules/.cache/unbe-images');

const LOGO = 'https://unbeperfumes.com/cdn/shop/files/Unbe_Logo.png';
const HEIGHT = 1400;
const ROWS = 256;
const MAX_BYTES = 400 * 1024;

async function readProducts() {
  // products.ts tipli; veriyi JSON dizisinden okuyoruz (tek doğruluk kaynağı)
  const src = await fs.readFile(path.join(root, 'src/data/products.ts'), 'utf8');
  const start = src.indexOf('= [', src.indexOf('export const products')) + 2;
  const end = src.indexOf('] as Product[]', start);
  return JSON.parse(src.slice(start, end + 1));
}

async function download(url) {
  await fs.mkdir(cacheDir, { recursive: true });
  const file = path.join(cacheDir, path.basename(new URL(url).pathname));
  try {
    return await fs.readFile(file);
  } catch {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(file, buf);
    return buf;
  }
}

async function cutout(buf) {
  const blob = await removeBackground(new Blob([buf], { type: 'image/png' }), {
    model: 'medium',
    output: { format: 'image/png' },
  });
  return Buffer.from(await blob.arrayBuffer());
}

/** Alfa > threshold olan sınır kutusu */
async function alphaBox(buf, threshold = 8) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

async function cleanAlpha(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 3; i < data.length; i += 4) if (data[i] < 24) data[i] = 0;
  return sharp(data, { raw: info }).png().toBuffer();
}

function profile(data, w, h) {
  const rows = [];
  const spans = [];
  for (let r = 0; r < ROWS; r++) {
    const y = Math.min(h - 1, Math.round(((r + 0.5) / ROWS) * h));
    let l = -1, rr = -1;
    for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 128) { if (l < 0) l = x; rr = x; }
    const half = l < 0 ? 0 : (rr - l + 1) / 2 / w;
    rows.push(+half.toFixed(5));
    spans.push([l, rr, y]);
  }
  // neck: kapak ekvatorundan sonra satır genişliğinin ilk kez %60'tan fazla sıçradığı yer
  // (gövde omzu eliptik olduğundan sıçrama birkaç satıra yayılır: en dar satıra göre ölçülür;
  //  neck = en dar satırdan hemen sonraki satır, yani gövde silüetinin başladığı yer)
  let neck = 0.33;
  let peak = 0;
  let min = -1;
  for (let i = 1; i < ROWS; i++) {
    if (min < 0) {
      if (rows[i] > rows[peak]) peak = i;
      if (i > peak + 2) min = i;
      continue;
    }
    if (rows[i] < rows[min]) min = i;
    if (rows[min] > 0 && rows[i] > rows[min] * 1.6) { neck = (min + 1) / ROWS; break; }
  }
  // kenar rengi: gövdenin sol/sağ kenarından 6 px içerisi
  let cr = 0, cg = 0, cb = 0, n = 0;
  const from = Math.ceil(neck * ROWS) + 6;
  for (let r = from; r < ROWS - 6; r++) {
    const [l, rr, y] = spans[r];
    if (l < 0) continue;
    for (const x of [l + 6, rr - 6]) {
      const o = (y * w + x) * 4;
      cr += data[o]; cg += data[o + 1]; cb += data[o + 2]; n++;
    }
  }
  const hex = (v) => Math.round(v / Math.max(1, n)).toString(16).padStart(2, '0');
  return { neck: +neck.toFixed(4), rows, edgeColor: `#${hex(cr)}${hex(cg)}${hex(cb)}` };
}

async function encodePng(img) {
  let out = await img.clone().png({ compressionLevel: 9, effort: 10 }).toBuffer();
  if (out.length > MAX_BYTES) out = await img.clone().png({ palette: true, quality: 95, effort: 10, dither: 0.6 }).toBuffer();
  if (out.length > MAX_BYTES) out = await img.clone().png({ palette: true, quality: 85, colours: 200, effort: 10 }).toBuffer();
  return out;
}

async function product(p) {
  const raw = await download(p.image);
  const cut = await cutout(raw);
  // gürültü: arka plan silicinin bıraktığı çok düşük alfalı pikselleri temizle
  const clean = await cleanAlpha(cut);
  const box = await alphaBox(clean, 32);
  const scaled = sharp(clean).extract(box).resize({ height: HEIGHT });
  const { data, info } = await scaled.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const prof = profile(data, info.width, info.height);
  const png = await encodePng(sharp(data, { raw: info }));
  await fs.writeFile(path.join(outDir, `${p.id}.png`), png);
  await fs.writeFile(
    path.join(outDir, `${p.id}.json`),
    JSON.stringify({ ...prof, width: info.width, height: info.height }),
  );
  console.log(`${p.id.padEnd(11)} ${info.width}×${info.height}  ${(png.length / 1024).toFixed(0)} KB  neck ${prof.neck}  edge ${prof.edgeColor}`);
}

async function logo() {
  const raw = await download(LOGO);
  const box = await alphaBox(raw, 4);
  const png = await sharp(raw).extract(box).resize({ height: 160 }).png({ compressionLevel: 9 }).toBuffer();
  await fs.writeFile(path.join(brandDir, 'logo.png'), png);
  const meta = await sharp(png).metadata();
  console.log(`logo        ${meta.width}×${meta.height}  ${(png.length / 1024).toFixed(0)} KB`);
}

/** Ürün fotoğrafları galerisi: markanın kendi Shopify ürün sayfasındaki 6 görsel → public/foto/<id>/<n>.webp */
async function gallery(p) {
  const res = await fetch(`${p.url}.json`);
  if (!res.ok) throw new Error(`${p.url}.json → ${res.status}`);
  const { product } = await res.json();
  const dir = path.join(root, 'public/foto', p.id);
  await fs.mkdir(dir, { recursive: true });
  let n = 0;
  for (const img of product.images) {
    const buf = await download(img.src.split('?')[0]);
    const webp = await sharp(buf).flatten({ background: '#ffffff' }).resize(1200, 1200, { fit: 'inside' }).webp({ quality: 82 }).toBuffer();
    await fs.writeFile(path.join(dir, `${++n}.webp`), webp);
  }
  console.log(`${p.id.padEnd(11)} galeri ${n} foto · fiyat ${product.variants[0].price} (önce ${product.variants[0].compare_at_price})`);
}

await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(brandDir, { recursive: true });
const onlyGallery = process.argv.includes('--gallery');
if (!onlyGallery) await logo();
for (const p of await readProducts()) {
  if (!onlyGallery) await product(p);
  await gallery(p);
}
