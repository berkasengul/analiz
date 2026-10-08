// npm run cards — #all kartlarının görsellerini sahneden render eder (4:5) ve
// public/cards/<id>.webp olarak kaydeder. Kart içinde ayrı Canvas yerine bu görseller kullanılır.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public/cards');
const PORT = 4181;
const IDS = ['no-tears', 'no-excuse', 'no-drama', 'no-regrets', 'no-filter', 'no-rules'];

const b = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
if (b.status !== 0) process.exit(b.status ?? 1);
fs.mkdirSync(outDir, { recursive: true });

const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], { cwd: root, stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview başlamadı')), 60000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { clearTimeout(t); reject(new Error(String(d))); });
});
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 800 }, deviceScaleFactor: 1.25 });
  for (const id of IDS) {
    await page.goto(`http://localhost:${PORT}/?card=${id}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.cardReady === '1', null, { timeout: 60000 });
    await page.waitForSelector('.mark', { state: 'detached', timeout: 30000 });
    await page.waitForTimeout(2500);
    const png = await page.screenshot();
    const webp = await sharp(png).resize(800, 1000).webp({ quality: 80, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(outDir, `${id}.webp`), webp);
    console.log(`${id}.webp  ${(webp.length / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
  server.kill();
}
