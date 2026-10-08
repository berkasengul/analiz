// npm run shots — 1440×810 ve 390×844'te her bölümün ekran görüntüsünü shots/ klasörüne alır.
// dist/ yoksa önce derler, ardından `vite preview` ile sunar. Konsol hata/uyarılarını raporlar.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'shots');
const PORT = 4179;
const only = process.argv.slice(2); // ör. `npm run shots -- desktop flavors`

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  const b = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
  if (b.status !== 0) process.exit(b.status ?? 1);
}
fs.mkdirSync(out, { recursive: true });

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview başlamadı')), 60000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { clearTimeout(t); reject(new Error(String(d))); });
});

const launchOpts = {
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
};
const browser = await chromium.launch(launchOpts);

const problems = [];

async function run(label, viewport, isMobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });
  const page = await ctx.newPage();
  // yavaş (yazılımsal WebGL) tarayıcıda da yerleşmiş pozlar/renkler yakalansın
  await page.addInitScript(() => { window.__unbeSettle = true; });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(`[${label}] ${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => problems.push(`[${label}] pageerror: ${e.message}`));
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.mark', { state: 'detached', timeout: 90000 });
  await page.waitForTimeout(1500);

  const top = (id) => page.evaluate((i) => { const e = document.getElementById(i); return { top: e.offsetTop, h: e.offsetHeight, vh: innerHeight }; }, id);
  const go = async (y, wait = 2600) => {
    await page.evaluate((v) => window.scrollTo(0, v), Math.round(y));
    await page.waitForTimeout(wait);
  };
  const shot = async (name) => {
    if (only.length > 1 && !only.slice(1).some((o) => name.includes(o))) return;
    await page.screenshot({ path: path.join(out, `${label}-${name}.png`) });
    console.log(`  ${label}-${name}.png`);
  };

  // 01 #flavors — her koku
  const f = await top('flavors');
  const step = (f.h - f.vh) / 5;
  const pages = isMobile ? [0, 2, 4] : [0, 1, 2, 3, 4, 5];
  for (const i of pages) { await go(f.top + i * step, 3000); await shot(`01-flavors-${i + 1}`); }

  // parfümü sık
  await go(f.top, 2500);
  const sprayBtn = page.locator('.hud__cta--spray');
  await sprayBtn.click();
  await page.waitForTimeout(1250);
  await shot('01-flavors-spray');
  await page.waitForTimeout(3500);

  // 02 #ritual — üç adım
  const r = await top('ritual');
  for (let i = 0; i < 3; i++) { await go(r.top + ((r.h - r.vh) * (i + 0.45)) / 3); await shot(`02-ritual-${i + 1}`); }

  // 03 #pyramid — kapalı ve açık
  const p = await top('pyramid');
  await go(p.top + (p.h - p.vh) * 0.02); await shot('03-pyramid-closed');
  await go(p.top + (p.h - p.vh) * 0.6, 3200); await shot('03-pyramid-open');

  // 04 #finder — boş ve sonuç
  const fi = await top('finder');
  await go(fi.top); await shot('04-finder');
  for (const letter of [0, 3, 2]) {
    await page.locator('.fi-opt').nth(letter).click();
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2600);
  await shot('04-finder-result');

  // 05 #all, 06 #shop, 07–10
  const a = await top('all');
  await go(a.top, 1500); await shot('05-all');
  const s = await top('shop');
  await go(s.top); await shot('06-shop');
  for (const [id, name] of [['story', '07-story'], ['faq', '08-faq'], ['contact', '09-contact']]) {
    const b = await top(id);
    await go(b.top, 1200); await shot(name);
  }
  await go(1e7, 1200); await shot('10-footer');

  // sepet çekmecesi
  await page.evaluate(() => document.querySelector('.cart-btn')?.click());
  await page.waitForTimeout(900);
  await shot('11-cart');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // ürün detayı (tüm ürünler kartından)
  const al = await top('all');
  await go(al.top, 1500);
  await page.locator('.card-media').first().click();
  await page.waitForTimeout(5000);
  await shot('12-detail');
  // hikâye: şişenin arka yüzü
  await page.locator('.feat').nth(2).click();
  await page.waitForTimeout(4000);
  await shot('13-detail-story');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);

  // menü
  await page.locator('.menu-btn').click();
  await page.waitForTimeout(4000);
  await shot('14-menu');
  await page.locator('.menu-btn').click();
  await page.waitForTimeout(1000);
  await ctx.close();
}

try {
  const which = only[0];
  if (!which || which === 'desktop') { console.log('1440×810'); await run('desktop', { width: 1440, height: 810 }, false); }
  if (!which || which === 'mobile') { console.log('390×844'); await run('mobile', { width: 390, height: 844 }, true); }
} finally {
  await browser.close();
  server.kill();
}

if (problems.length) {
  console.log(`\nKonsol uyarı/hata (${problems.length}):`);
  for (const p of [...new Set(problems)]) console.log('  ' + p);
} else {
  console.log('\nKonsolda hata/uyarı yok.');
}
