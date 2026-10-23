#!/usr/bin/env node
// Downloads the HDRIs and PBR textures listed in scripts/assets.json from Poly Haven or ambientCG (both CC0).
// No dependencies: uses Node's built-in fetch and zlib (Node 18+). ambientCG ships a zip per resolution;
// it is unpacked in memory and only the needed maps are written.
// A texture entry picks its source with "source": "polyhaven" (default) or "ambientcg".
//
//   node scripts/fetch-assets.mjs            download missing files
//   node scripts/fetch-assets.mjs --dry-run  resolve URLs only, download nothing
//
// Paths in the manifest are relative to the project root (the parent of this scripts/ folder).

import { readFile, mkdir, stat, writeFile, rename, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const MANIFEST = path.join(SCRIPT_DIR, 'assets.json');
const API = 'https://api.polyhaven.com';
const ACG_API = 'https://ambientcg.com/api/v2/full_json';
// Poly Haven asks API users to send a descriptive User-Agent.
const HEADERS = { 'User-Agent': 'karga-zihni-asset-fetch/1.0 (+https://www.youtube.com/@kargazihni)' };
const DRY_RUN = process.argv.includes('--dry-run');

// Poly Haven map name -> fixed local file name. nor_gl is the OpenGL normal map (three.js convention);
// nor_dx is never used. AO is optional because a few textures don't ship it.
const TEXTURE_MAPS = [
  { key: 'Diffuse', file: 'color.jpg', required: true },
  { key: 'nor_gl', file: 'normal.jpg', required: true },
  { key: 'Rough', file: 'roughness.jpg', required: true },
  { key: 'AO', file: 'ao.jpg', required: false },
];

// ambientCG map suffix (…_2K-JPG_<Suffix>.jpg) -> fixed local file name. NormalGL only (never NormalDX).
const ACG_MAPS = [
  { key: 'Color', file: 'color.jpg', required: true },
  { key: 'NormalGL', file: 'normal.jpg', required: true },
  { key: 'Roughness', file: 'roughness.jpg', required: true },
  { key: 'Metalness', file: 'metalness.jpg', required: false },
  { key: 'AmbientOcclusion', file: 'ao.jpg', required: false },
  { key: 'Opacity', file: 'opacity.jpg', required: false },   // Decal (ör. Leaking): saydamlık maskesi
];

const results = [];   // { asset, file, status, bytes }

const fmtBytes = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);

async function exists(file) {
  try { return (await stat(file)).size > 0; } catch { return false; }
}

async function getJSON(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

async function download(entry, dest, label) {
  const rel = path.relative(ROOT, dest);
  if (await exists(dest)) {
    results.push({ asset: label, file: rel, status: 'zaten var', bytes: (await stat(dest)).size });
    return;
  }
  if (DRY_RUN) {
    results.push({ asset: label, file: rel, status: 'indirilecek', bytes: entry.size || 0, url: entry.url });
    return;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(entry.url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${entry.url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (entry.size && buf.length !== entry.size) throw new Error(`${rel}: boyut uyuşmuyor (${buf.length} ≠ ${entry.size})`);
  if (entry.md5) {
    const md5 = createHash('md5').update(buf).digest('hex');
    if (md5 !== entry.md5) throw new Error(`${rel}: md5 uyuşmuyor`);
  }
  // write to a temp file first so an interrupted run never leaves a half file that would later be "skipped"
  const tmp = `${dest}.part`;
  await writeFile(tmp, buf);
  await rename(tmp, dest).catch(async (e) => { await rm(tmp, { force: true }); throw e; });
  results.push({ asset: label, file: rel, status: 'indirildi', bytes: buf.length });
}

function pick(files, mapKey, res, format, id) {
  const byRes = files[mapKey];
  if (!byRes) return null;
  const byFmt = byRes[res];
  if (!byFmt) throw new Error(`${id}: ${mapKey} için ${res} yok (mevcut: ${Object.keys(byRes).join(', ')})`);
  const entry = byFmt[format];
  if (!entry) throw new Error(`${id}: ${mapKey} ${res} için ${format} yok (mevcut: ${Object.keys(byFmt).join(', ')})`);
  return entry;
}

async function fetchHdri(item) {
  const files = await getJSON(`${API}/files/${item.id}`);
  const entry = pick(files, 'hdri', item.resolution, 'hdr', item.id);
  if (!entry) throw new Error(`${item.id}: HDRI dosyası bulunamadı`);
  await download(entry, path.resolve(ROOT, item.target), `${item.name} (${item.id})`);
}

async function fetchTexture(item) {
  const files = await getJSON(`${API}/files/${item.id}`);
  const dir = path.resolve(ROOT, item.target);
  for (const m of TEXTURE_MAPS) {
    const entry = pick(files, m.key, item.resolution, 'jpg', item.id);
    if (!entry) {
      if (m.required) throw new Error(`${item.id}: zorunlu harita ${m.key} yok`);
      results.push({ asset: `${item.name} (${item.id})`, file: path.relative(ROOT, path.join(dir, m.file)), status: 'kaynakta yok', bytes: 0 });
      continue;
    }
    await download(entry, path.join(dir, m.file), `${item.name} (${item.id})`);
  }
}

// Minimal zip reader (stored / deflate), enough for ambientCG archives.
function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('zip: dizin sonu bulunamadı');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let k = 0; k < count; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('zip: bozuk merkez dizin');
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    entries.set(name, () => {
      const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28), data = buf.subarray(start, start + csize);
      const out = method === 0 ? Buffer.from(data) : method === 8 ? inflateRawSync(data) : null;
      if (!out) throw new Error(`zip: desteklenmeyen sıkıştırma (${method}) — ${name}`);
      if (out.length !== usize) throw new Error(`zip: boyut uyuşmuyor — ${name}`);
      return out;
    });
    p += 46 + nlen + xlen + clen;
  }
  return entries;
}

async function fetchAmbientCG(item) {
  const label = `${item.name} (${item.id})`, dir = path.resolve(ROOT, item.target);
  const attr = `${(item.resolution || '2k').toUpperCase()}-JPG`;
  const all = await Promise.all(ACG_MAPS.map(async (m) => ({ m, dest: path.join(dir, m.file), have: await exists(path.join(dir, m.file)) })));
  const isDecal = /^Leaking|Decal/i.test(item.id) || item.kind === 'decal';
  const req = all.filter((x) => (isDecal ? ['Color', 'Opacity'].includes(x.m.key) : x.m.required));
  if (req.every((x) => x.have)) {             // zorunlu haritalar zaten var: zip tekrar indirilmez
    for (const x of all) if (x.have) results.push({ asset: label, file: path.relative(ROOT, x.dest), status: 'zaten var', bytes: (await stat(x.dest)).size });
    return;
  }
  const info = await getJSON(`${ACG_API}?type=${isDecal ? 'Decal' : 'Material'}&id=${encodeURIComponent(item.id)}&include=downloadData`);
  const asset = (info.foundAssets || []).find((a) => a.assetId === item.id);
  if (!asset) throw new Error(`${item.id}: ambientCG'de bulunamadı`);
  const dl = asset.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads?.find((d) => d.attribute === attr);
  if (!dl) throw new Error(`${item.id}: ${attr} paketi yok`);
  if (DRY_RUN) {
    results.push({ asset: label, file: path.relative(ROOT, dir) + `/ (${dl.fileName})`, status: 'indirilecek', bytes: dl.size || 0 });
    return;
  }
  const res = await fetch(dl.fullDownloadPath || dl.downloadLink, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${dl.fileName}`);
  const zip = readZip(Buffer.from(await res.arrayBuffer()));
  await mkdir(dir, { recursive: true });
  for (const { m, dest, have } of all) {
    const rel = path.relative(ROOT, dest);
    if (have) { results.push({ asset: label, file: rel, status: 'zaten var', bytes: (await stat(dest)).size }); continue; }
    const name = [...zip.keys()].find((n) => new RegExp(`_${m.key}\\.jpe?g$`, 'i').test(n));
    if (!name) {
      if (isDecal ? ['Color', 'Opacity'].includes(m.key) : m.required) throw new Error(`${item.id}: zorunlu harita ${m.key} pakette yok`);
      results.push({ asset: label, file: rel, status: 'kaynakta yok', bytes: 0 });
      continue;
    }
    const data = zip.get(name)(), tmp = `${dest}.part`;
    await writeFile(tmp, data);
    await rename(tmp, dest).catch(async (e) => { await rm(tmp, { force: true }); throw e; });
    results.push({ asset: label, file: rel, status: 'indirildi', bytes: data.length });
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  const jobs = [
    ...(manifest.hdris || []).map((i) => ({ ...i, kind: 'hdri' })),
    ...(manifest.textures || []).map((i) => ({ ...i, kind: 'texture' })),
  ];
  let failed = 0;
  for (const item of jobs) {
    if (!item.id) {
      console.log(`- ${item.name}: id seçilmemiş, atlandı${item.candidates ? ` (adaylar: ${item.candidates.join(', ')})` : ''}`);
      continue;
    }
    try {
      if (item.kind === 'hdri') await fetchHdri(item);
      else if ((item.source || 'polyhaven') === 'ambientcg') await fetchAmbientCG(item);
      else await fetchTexture(item);
    } catch (e) {
      failed++;
      console.error(`✗ ${item.name}: ${e.message}`);
    }
  }

  console.log(DRY_RUN ? '\nDeneme modu (hiçbir şey indirilmedi):' : '\nSonuç:');
  const w = Math.max(10, ...results.map((r) => r.file.length));
  for (const r of results) console.log(`  ${r.status.padEnd(12)} ${r.file.padEnd(w)}  ${r.bytes ? fmtBytes(r.bytes) : '-'}`);
  const dl = results.filter((r) => r.status === 'indirildi');
  const planned = results.filter((r) => r.status === 'indirilecek');
  if (dl.length) console.log(`\n${dl.length} dosya indirildi, toplam ${fmtBytes(dl.reduce((a, r) => a + r.bytes, 0))}.`);
  if (planned.length) console.log(`\n${planned.length} dosya indirilecek, toplam ${fmtBytes(planned.reduce((a, r) => a + r.bytes, 0))}.`);
  if (failed) { console.error(`\n${failed} asset başarısız.`); process.exitCode = 1; }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
