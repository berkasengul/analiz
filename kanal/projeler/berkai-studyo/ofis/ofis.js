// BerkAİ Stüdyo 3D ofisi: yürüme, paneller, kararlar, demo ekranları ve ?tur=1 sinematik turu.
// Veri: veri.js (window.OFIS_VERI) -> node araclar/ofis_veri_uret.js ile gunler/<tarih>/ çıktılarından üretilir.
import * as THREE from 'three';
import { kur, YERLER, SINIR } from './dunya.js';

const V = window.OFIS_VERI, TUR_MODU = new URLSearchParams(location.search).get('tur') === '1';
if (TUR_MODU) document.documentElement.classList.add('tur');
const $ = s => document.querySelector(s), el = (t, o = {}, ...c) => { const e = Object.assign(document.createElement(t), o); e.append(...c); return e; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), yum = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const E = Object.fromEntries(V.ekipler.map(e => [e.id, e])), SIRA = ['konu', 'yapim', 'musteri', 'site', 'mail', 'mudur'].filter(i => E[i]);
$('#tarih').textContent = V.tarih_yazi;

// ---------- küçük markdown / csv gösterici ----------
function satirIci(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])_([^_]+)_(?=[\s).,;:]|$)/g, '$1<em>$2</em>').replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>').replace(/(^|\s)(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>'); }
function md(s) {
  const L = s.split('\n'), o = []; let i = 0, liste = null;
  const kapat = () => { if (liste) { o.push(`</${liste}>`); liste = null; } };
  while (i < L.length) {
    const l = L[i];
    if (/^```/.test(l)) { kapat(); const b = []; i++; while (i < L.length && !/^```/.test(L[i])) b.push(L[i++]); o.push('<pre>' + esc(b.join('\n')) + '</pre>'); i++; continue; }
    if (/^\|/.test(l) && /^\|[\s:|-]+\|?\s*$/.test(L[i + 1] || '')) { kapat(); const h = l.split('|').slice(1, -1); i += 2; const r = []; while (i < L.length && /^\|/.test(L[i])) r.push(L[i++].split('|').slice(1, -1)); o.push('<table><thead><tr>' + h.map(c => `<th>${satirIci(c.trim())}</th>`).join('') + '</tr></thead><tbody>' + r.map(x => '<tr>' + x.map(c => `<td>${satirIci(c.trim())}</td>`).join('') + '</tr>').join('') + '</tbody></table>'); continue; }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { kapat(); const n = Math.min(3, m[1].length); o.push(`<h${n}>${satirIci(m[2])}</h${n}>`); }
    else if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (liste !== 'ul') { kapat(); o.push('<ul>'); liste = 'ul'; } o.push(`<li>${satirIci(m[1])}</li>`); }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (liste !== 'ol') { kapat(); o.push('<ol>'); liste = 'ol'; } o.push(`<li>${satirIci(m[1])}</li>`); }
    else if (/^(-{3,}|━{3,})\s*$/.test(l)) { kapat(); o.push('<hr>'); }
    else if (/^>\s?/.test(l)) { kapat(); o.push(`<p><em>${satirIci(l.replace(/^>\s?/, ''))}</em></p>`); }
    else if (!l.trim()) kapat();
    else { kapat(); o.push(`<p>${satirIci(l)}</p>`); }
    i++;
  }
  kapat(); return o.join('\n');
}
function csv(s) { const r = s.trim().split(/\r?\n/).map(l => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const k = l[i]; if (q) { if (k === '"' && l[i + 1] === '"') { c += '"'; i++; } else if (k === '"') q = false; else c += k; } else if (k === '"') q = true; else if (k === ';') { o.push(c); c = ''; } else c += k; } o.push(c); return o; }); return '<table><thead><tr>' + r[0].map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead><tbody>' + r.slice(1).map(x => '<tr>' + x.map(c => `<td>${satirIci(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>'; }
const belgeHtml = b => b.tur === 'md' ? md(b.icerik) : b.tur === 'csv' ? csv(b.icerik) : b.tur === 'txt' ? md(b.icerik) : '<pre>' + esc(b.icerik) + '</pre>';

// ---------- kararlar (localStorage, try/catch) ----------
const ANAHTAR = 'berkai_kararlar_' + V.tarih;
let kararDurum = {};
for (const k of V.verilmis_kararlar || []) kararDurum[k.id] = { karar: k.karar, not: k.not || '' };
if (!TUR_MODU) { try { const s = localStorage.getItem(ANAHTAR); if (s) Object.assign(kararDurum, JSON.parse(s)); } catch (e) { /* depolama kapalı olabilir */ } }
function kararKaydet() { if (TUR_MODU) return; try { localStorage.setItem(ANAHTAR, JSON.stringify(kararDurum)); } catch (e) { /* yok say */ } }
function kararDisaAktar() {
  const veri = { tarih: V.tarih, disa_aktarim: new Date().toISOString(), aciklama: `Bu dosyayı gunler/${V.tarih}/kararlar.json olarak kaydet; GUNLUK_KOMUT yarın buradan devam eder.`, kararlar: V.kararlar.map(k => ({ id: k.id, baslik: k.baslik, karar: (kararDurum[k.id] || {}).karar || 'bekliyor', not: (kararDurum[k.id] || {}).not || '' })) };
  const a = el('a', { href: URL.createObjectURL(new Blob([JSON.stringify(veri, null, 2)], { type: 'application/json' })), download: 'kararlar.json' }); document.body.append(a); a.click(); a.remove();
}

// ---------- panel ----------
const panel = $('#panel'); let acikPanel = null, acikBelge = {};
function panelKur(id) {
  const e = E[id], renk = YERLER[id].renk; panel.innerHTML = '';
  const kapat = el('button', { textContent: 'Kapat (E)', onclick: () => panelAc(null) });
  panel.append(el('header', {}, el('span', { className: 'renk', style: `background:${renk}` }), el('div', {}, el('p', { className: 'kucuk', textContent: id === 'mudur' ? 'Müdür odası · ' + V.tarih_yazi : 'Ekip · ' + V.tarih_yazi }), el('h2', { textContent: e.ad })), kapat));
  const g = el('div', { className: 'govde' }); panel.append(g);
  g.append(el('p', { className: 'ozet', textContent: e.ozet }));
  if (e.rakamlar) g.append(el('div', { className: 'rakamlar', innerHTML: e.rakamlar.map(r => `<div><b>${esc(r.d)}</b><span>${esc(r.e)}</span></div>`).join('') }));
  if (id === 'mudur') kararlarKur(g);
  if (id === 'musteri' && V.adaylar.length) {
    g.append(el('h3', { textContent: 'Bugün bakılan işletmeler' }));
    const k = el('div', { className: 'kartlar' });
    for (const a of V.adaylar) { const o = a.olcum; k.append(el('article', { innerHTML: (a.ekran ? `<img loading="lazy" src="${esc(a.ekran)}" alt="${esc(a.ad)} sitesinin ekran görüntüsü">` : '') + `<div class="ic"><h4>${esc(a.ad)}</h4><p><span class="rozet ${esc(a.oncelik)}">${a.oncelik === '—' ? 'elendi' : esc(a.oncelik)}</span>${esc(a.sektor)} · ${esc(a.sehir)}</p><p>${esc(a.neden)}</p><p>${o ? `Telefonda ilk görüntü ${(o.tel_ilk / 1000).toFixed(1).replace('.', ',')} sn · ${esc(o.platform)}` : ''}</p><p><strong>${esc(a.durum)}</strong></p></div>` })); }
    g.append(k);
  }
  if (id === 'site' && V.siteler.length) {
    g.append(el('h3', { textContent: 'Demo siteler' })); const k = el('div', { className: 'kartlar' });
    for (const s of V.siteler) { const a = el('article', { innerHTML: `<img src="${esc(s.gorsel)}" alt="${esc(s.ad)} demo sitesi"><div class="ic"><h4>${esc(s.ad)}</h4><p><span class="rozet ${s.gecti ? 'gecti' : ''}">${s.gecti ? 'testten geçti' : 'testte kalan var'}</span>${Object.values(s.sonuc).filter(Boolean).length}/${Object.keys(s.sonuc).length} kontrol · ${s.kb} KB</p></div>` }); const b = el('button', { className: 'dugme ana', textContent: 'Demoyu aç', onclick: () => siteAc(s) }); a.querySelector('.ic').append(b); a.querySelector('img').onclick = () => siteAc(s); k.append(a); }
    g.append(k);
  }
  if (e.calisanlar) { g.append(el('h3', { textContent: 'Kim ne yaptı' })); const ul = el('ul', { className: 'calisan' }); for (const c of e.calisanlar) { const li = el('li', {}, el('span', { className: 'rol', textContent: c.rol }), el('span', { className: 'is', textContent: c.is })); if (c.cikti) li.append(el('button', { textContent: '→ ' + c.cikti, onclick: () => belgeAc(id, c.cikti) })); ul.append(li); } g.append(ul); }
  if (e.belgeler.length) { g.append(el('h3', { textContent: 'Bugünün işleri (dosyalar)' })); const s = el('div', { className: 'sekmeler' }), b = el('div', { className: 'belge' }); g.append(s, b); e.belgeler.forEach(d => s.append(el('button', { textContent: d.ad, onclick: () => belgeAc(id, d.ad) }))); belgeAc(id, acikBelge[id] || e.belgeler[0].ad, true); }
  if (id !== 'mudur') g.append(el('p', { className: 'kucuk', style: 'color:var(--soluk);font-size:13.5px;margin-top:14px', textContent: 'Klasör: ' + e.klasor + '/' }));
}
function belgeAc(id, ad, sessiz) {
  const e = E[id], d = e.belgeler.find(b => b.ad === ad) || e.belgeler.find(b => ad.endsWith(b.ad)); if (!d) return; acikBelge[id] = d.ad;
  const b = panel.querySelector('.belge'); if (!b) return; b.innerHTML = belgeHtml(d);
  panel.querySelectorAll('.sekmeler button').forEach(x => x.classList.toggle('a', x.textContent === d.ad));
  if (!sessiz) b.scrollIntoView({ block: 'start' });
}
function kararlarKur(g) {
  g.append(el('h3', { textContent: `Onayını bekleyen kararlar (${V.kararlar.length})` })); const kutu = el('div', { id: 'kararlar' }); g.append(kutu);
  const ciz = () => { kutu.innerHTML = ''; for (const k of V.kararlar) { const d = kararDurum[k.id] || {}, a = el('div', { className: 'karar ' + (d.karar || '') }); a.dataset.id = k.id;
      a.append(el('h4', { textContent: k.id + ' · ' + k.baslik }), el('p', { className: 'soru', textContent: k.soru }), el('p', { className: 'gerekce', textContent: 'Müdürün önerisi: ' + k.oneri + '. ' + k.gerekce }));
      const s = el('div', { className: 'satir' }), on = el('button', { className: 'dugme onayla' + (d.karar === 'onay' ? ' sec' : ''), textContent: 'Onayla' }), re = el('button', { className: 'dugme reddet' + (d.karar === 'ret' ? ' sec' : ''), textContent: 'Reddet' });
      on.onclick = () => { kararDurum[k.id] = { ...d, karar: d.karar === 'onay' ? undefined : 'onay' }; kararKaydet(); ciz(); if (kararDurum[k.id].karar) sevincBit = saat() + 2.4; };
      re.onclick = () => { kararDurum[k.id] = { ...d, karar: d.karar === 'ret' ? undefined : 'ret' }; kararKaydet(); ciz(); };
      const nt = el('input', { placeholder: 'Not (isteğe bağlı)', value: d.not || '' }); nt.oninput = () => { kararDurum[k.id] = { ...(kararDurum[k.id] || {}), not: nt.value }; kararKaydet(); };
      s.append(on, re, el('span', { className: 'durum', textContent: d.karar === 'onay' ? 'Onaylandı' : d.karar === 'ret' ? 'Reddedildi' : 'Bekliyor' }), nt); a.append(s); kutu.append(a); }
    const say = V.kararlar.filter(k => (kararDurum[k.id] || {}).karar).length; sayac.textContent = `${say}/${V.kararlar.length} karar verildi. Dosyayı gunler/${V.tarih}/kararlar.json olarak kaydet.`; };
  const sayac = el('span'), akt = el('div', { className: 'aktar' }, el('button', { className: 'dugme ana', textContent: 'Kararları dışa aktar', onclick: kararDisaAktar }), sayac);
  ciz(); kararCiz = ciz; queueMicrotask(() => panel.querySelector('.govde').append(akt));
}
let kararCiz = () => { };
function panelAc(id) { if (id === acikPanel) return; acikPanel = id; if (id) { panelKur(id); panel.querySelector('.govde').scrollTop = 0; } panel.classList.toggle('acik', !!id); }

// görsel büyütme
const buyut = el('div', { id: 'buyut' }, el('img', { alt: '' })); document.body.append(buyut); buyut.onclick = () => buyut.classList.remove('acik');
panel.addEventListener('click', e => { if (e.target.tagName === 'IMG' && e.target.closest('#panel .kartlar') && acikPanel === 'musteri') { buyut.firstChild.src = e.target.src; buyut.classList.add('acik'); } });

// ---------- demo site ekranı ----------
const siteKutu = $('#site'), cerceve = $('#site-cerceve'); let acikSite = null;
function siteAc(s) { acikSite = s; $('#site-ad').textContent = s.ad + ' · konsept demo'; $('#site-yeni').href = s.yol; if (!TUR_MODU) cerceve.src = s.yol; siteKutu.classList.add('acik'); }
function siteKapat() { acikSite = null; siteKutu.classList.remove('acik'); if (!TUR_MODU) cerceve.src = 'about:blank'; }
$('#site-kapat').onclick = siteKapat; siteKutu.addEventListener('click', e => { if (e.target === siteKutu) siteKapat(); });

// ---------- sahne ----------
const canvas = $('#c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: TUR_MODU, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const cam = new THREE.PerspectiveCamera(58, 1, .08, 220);
function boyut() { renderer.setPixelRatio(TUR_MODU ? 1 : Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', boyut); boyut();
const t0 = performance.now(), saat = () => (performance.now() - t0) / 1000; let sevincBit = -1;

let D;
try { D = await kur(renderer, V, p => { $('#yuk-cubuk').style.width = (p * 100) + '%'; }); }
catch (e) { $('#yuk-yazi').textContent = 'Ofis açılamadı.'; $('#yuk-hata').textContent = 'Dosyalar bir web sunucusundan açılmalı (README.md → "Ofisi açmak"). Ayrıntı: ' + e.message; throw e; }

// ---------- oyuncu ----------
const oyuncu = { x: 0, z: 8.4, yaw: 0, pitch: -.02 }, tus = {};
const yazıyor = () => /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
addEventListener('keydown', e => { if (yazıyor()) { if (e.key === 'Escape') document.activeElement.blur(); return; } const k = e.key.toLowerCase(); tus[k] = true;
  if (k === 'escape') { if (buyut.classList.contains('acik')) buyut.classList.remove('acik'); else if (acikSite) siteKapat(); else panelAc(null); }
  if (k === 'e' && !acikSite) { panelAc(acikPanel ? null : yakin); }
  if (/^[1-6]$/.test(k) && SIRA[+k - 1]) isinla(SIRA[+k - 1]);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault(); });
addEventListener('keyup', e => { tus[e.key.toLowerCase()] = false; }); addEventListener('blur', () => { for (const k in tus) tus[k] = false; });
const DURUS = { konu: [-8.0, -1.0], yapim: [0.4, -1.0], musteri: [-8.0, 1.6], site: [0.4, 2.2], mail: [2.6, 1.8], mudur: [10.3, -4.6] };
function isinla(id) { const [x, z] = DURUS[id], y = YERLER[id]; oyuncu.x = x; oyuncu.z = z; oyuncu.yaw = Math.atan2(-(y.x - x), -(y.z - z)); oyuncu.pitch = -.05; panelAc(null); }
let sur = null, oynadi = 0;
canvas.addEventListener('pointerdown', e => { sur = { x: e.clientX, y: e.clientY, yaw: oyuncu.yaw, pitch: oyuncu.pitch }; oynadi = 0; canvas.setPointerCapture(e.pointerId); canvas.classList.add('surukle'); });
canvas.addEventListener('pointermove', e => { if (!sur) return; const dx = e.clientX - sur.x, dy = e.clientY - sur.y; oynadi = Math.max(oynadi, Math.abs(dx) + Math.abs(dy)); oyuncu.yaw = sur.yaw + dx * .0042; oyuncu.pitch = clamp(sur.pitch + dy * .0036, -1.1, 1.1); });
const isin = new THREE.Raycaster(), fare = new THREE.Vector2();
canvas.addEventListener('pointerup', e => { canvas.classList.remove('surukle'); if (sur && oynadi < 6) { fare.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); isin.setFromCamera(fare, cam); const h = isin.intersectObjects(D.ekranlar)[0]; if (h && h.distance < 14) siteAc(h.object.userData.site); } sur = null; });
canvas.addEventListener('pointercancel', () => { sur = null; canvas.classList.remove('surukle'); });
function yuru(dt) {
  if (yazıyor() || acikSite) return;
  const ileri = (tus.w || tus.arrowup ? 1 : 0) - (tus.s || tus.arrowdown ? 1 : 0), yan = (tus.d ? 1 : 0) - (tus.a ? 1 : 0), don = (tus.arrowright ? 1 : 0) - (tus.arrowleft ? 1 : 0);
  oyuncu.yaw -= don * dt * 1.9;
  if (!ileri && !yan) return; const hiz = (tus.shift ? 6.5 : 3.6) * dt / Math.hypot(ileri, yan), s = Math.sin(oyuncu.yaw), c = Math.cos(oyuncu.yaw);
  let nx = oyuncu.x + (-s * ileri + c * yan) * hiz, nz = oyuncu.z + (-c * ileri - s * yan) * hiz; const R = .38;
  const carpar = (x, z) => x < SINIR.x0 || x > SINIR.x1 || z < SINIR.z0 || z > SINIR.z1 || D.engeller.some(b => x > b[0] - R && x < b[1] + R && z > b[2] - R && z < b[3] + R);
  if (!carpar(nx, oyuncu.z)) oyuncu.x = nx; if (!carpar(oyuncu.x, nz)) oyuncu.z = nz;
}
let yakin = null; const ipucu = $('#ipucu');
function yakinBul() { let en = null, ed = 1e9; for (const id of SIRA) { const y = YERLER[id], d = Math.hypot(y.x - oyuncu.x, y.z - oyuncu.z); const icinde = id === 'mudur' ? (oyuncu.x > 8.9 && oyuncu.z < -1.8) : d < 4.9; if (icinde && d < ed) { en = id; ed = d; } } yakin = en;
  const goster = en && !acikPanel && !acikSite; ipucu.hidden = !goster; if (goster) ipucu.innerHTML = `<kbd>E</kbd> ${esc(E[en].ad)}: ${en === 'mudur' ? 'raporu oku, kararlarını ver' : 'bugün ne yaptı?'}`; }
const ek = $('#ekipler'); SIRA.forEach((id, i) => ek.append(el('button', { innerHTML: `<i style="background:${YERLER[id].renk}"></i>${i + 1} · ${esc(E[id].kisa)}`, onclick: () => { isinla(id); canvas.focus(); } })));
function kameraOyuncu() { cam.position.set(oyuncu.x, 1.65, oyuncu.z); cam.rotation.set(oyuncu.pitch, oyuncu.yaw, 0, 'YXZ'); }

// ---------- tur: her şey t'nin fonksiyonu ----------
const yon = id => YERLER[id];
// Panel sağ yarıyı kapladığı için ekip, görüntünün sol yarısına düşsün diye bakış 25° sağa kaydırılır.
const saga = (P, S, derece = 25) => { const dx = S[0] - P[0], dz = S[2] - P[2], q = derece * Math.PI / 180, c = Math.cos(q), n = Math.sin(q); return [P[0] + dx * c - dz * n, S[1], P[2] + dz * c + dx * n]; };
const DUR = { // [kamera], [ekip]
  konu: [[-5.9, 1.7, -0.3], [-10.6, 1.15, -4.0]], yapim: [[2.2, 1.7, -0.3], [-2.6, 1.15, -4.0]], musteri: [[-6.7, 1.7, -0.1], [-10.8, 1.15, 4.6]],
  site: [[1.9, 1.7, 2.3], [-2.6, 1.15, 4.6]], mail: [[2.4, 1.7, 0.1], [5.9, 1.15, 4.7]], mudur: [[9.9, 1.7, -3.3], [12.0, 1.25, -6.6]],
};
const dur = (id, t0, t1) => { const [P, S] = DUR[id], L = saga(P, S); return [[t0, ...P, ...L], [t1, P[0] + .25, P[1], P[2] + .15, ...L]]; };
const ANAHTAR_KARE = [ // [t, kamera x,y,z, bakış x,y,z]  (aynı t iki kez = kesme)
  [0, 0.4, 1.75, 9.5, -1, 1.9, -10], [7, 2.2, 1.7, 5.2, -2.5, 2.0, -10], [8.6, 2.2, 1.7, -0.3, -6, 1.5, -6],
  ...dur('konu', 10.2, 19), ...dur('yapim', 22, 31),
  [32.6, -6.0, 1.7, -0.3, -10, 1.3, 3], ...dur('musteri', 34, 43),
  [44, -6.0, 1.7, -0.3, 0, 1.5, 0], [45.2, 2.3, 1.7, -0.3, 0, 1.4, 4], ...dur('site', 46.2, 55),
  [56.4, 2.3, 1.7, -0.3, -3, 1.6, 0.8], [58, -4.6, 1.72, -1.55, -4.6, 1.75, 0.8], [70, -4.6, 1.72, -1.55, -4.6, 1.75, 0.8],
  [71.8, 1.6, 1.7, -0.5, 5, 1.4, 3.5], ...dur('mail', 73.2, 82),
  [84, 7.9, 1.7, -1.0, 10, 1.5, -6.2], [85.6, 7.9, 1.7, -6.15, 13, 1.4, -6.8], ...dur('mudur', 87.6, 100),
  [100, 7.6, 3.1, 8.9, -8, 1.2, -7], [107, 5.6, 2.8, 7.8, -9, 1.4, -8],
];
const PANELLER = [['konu', 10.4, 18.6], ['yapim', 22.4, 30.6], ['musteri', 34.4, 42.6], ['site', 46.4, 54.6], ['mail', 73.4, 81.6], ['mudur', 87.9, 99.6]];
const TUR_SITE = V.siteler[0], SITE_BAS = 58.4, SITE_BIT = 69.6, ONAY_T = 93.2;
const SAHNELER = [{ ad: 'Giriş', bas: 0, bit: 7 }, { ad: 'YouTube konu ekibi', bas: 7, bit: 19 }, { ad: 'YouTube yapım ekibi', bas: 19, bit: 31 }, { ad: 'Müşteri bulma ekibi', bas: 31, bit: 43 }, { ad: '3D site ekibi', bas: 43, bit: 55 }, { ad: 'Demo site ekranda: ' + (TUR_SITE ? TUR_SITE.ad : '—'), bas: 55, bit: 70 }, { ad: 'Mail ekibi', bas: 70, bit: 82 }, { ad: 'Müdür odası: karar onayı', bas: 82, bit: 100 }, { ad: 'Kapanış', bas: 100, bit: 107 }];
const imlec = $('#imlec'); let turPanel = null, turOnay = null;
const pA = new THREE.Vector3(), pB = new THREE.Vector3();
function turKare(t) {
  t = clamp(t, 0, 107); const K = ANAHTAR_KARE; let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = b[0] > a[0] ? yum((t - a[0]) / (b[0] - a[0])) : 1;
  cam.position.set(lerp(a[1], b[1], u), lerp(a[2], b[2], u) + Math.sin(t * 6.3) * .006, lerp(a[3], b[3], u)); pA.set(lerp(a[4], b[4], u), lerp(a[5], b[5], u), lerp(a[6], b[6], u)); cam.lookAt(pA);
  // panel
  let pid = null, kay = 0, ic = 0; for (const [id, s, e] of PANELLER) if (t >= s && t <= e && E[id]) { pid = id; kay = Math.min(yum((t - s) / .6), yum((e - t) / .5)); ic = t - s; }
  if (pid !== turPanel) { turPanel = pid; acikPanel = null; if (pid) { acikBelge[pid] = E[pid].belgeler[0] && E[pid].belgeler[0].ad; panelKur(pid); acikPanel = pid; } turOnay = null; }
  panel.style.transform = `translateX(${(1 - (pid ? kay : 0)) * 102}%)`;
  if (pid) { const g = panel.querySelector('.govde'), max = g.scrollHeight - g.clientHeight; if (pid === 'mudur') g.scrollTop = 0; else g.scrollTop = Math.min(max, Math.max(0, ic - 2.6) * 150); }
  // müdür odasında bir kararı onayla
  let sevinc = false;
  if (pid === 'mudur' && V.kararlar.length) { const k1 = V.kararlar[0], onay = t >= ONAY_T; if (onay !== turOnay) { turOnay = onay; kararDurum = onay ? { [k1.id]: { karar: 'onay' } } : {}; kararCiz(); }
    const dg = panel.querySelector('.karar .onayla'); if (dg && t > 90.4 && t < 96) { const r = dg.getBoundingClientRect(), q = yum((t - 90.4) / 2.2); imlec.hidden = false; imlec.style.left = lerp(innerWidth * .46, r.left + r.width * .55, q) + 'px'; imlec.style.top = lerp(innerHeight * .78, r.top + r.height * .55, q) + (t >= ONAY_T && t < ONAY_T + .25 ? 3 : 0) + 'px'; } else imlec.hidden = true; sevinc = t >= ONAY_T && t < ONAY_T + 4.2; } else imlec.hidden = true;
  // demo site ekranda
  const sg = TUR_SITE ? Math.min(yum((t - SITE_BAS) / .5), yum((SITE_BIT - t) / .5)) : 0; siteKutu.style.display = sg > 0 ? 'flex' : 'none'; siteKutu.style.opacity = sg;
  if (sg > 0 && cerceve.contentWindow && cerceve.contentWindow.TUR) cerceve.contentWindow.TUR.kare(clamp(t - SITE_BAS - .2, 0, cerceve.contentWindow.TUR.sure));
  D.guncelle(t, { sevinc }); renderer.render(D.scene, cam); return t;
}

// ---------- başlat ----------
if (TUR_MODU) {
  window.TUR = { sure: 107, sahneler: SAHNELER, kare: turKare };
  const bekle = [document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 400))];
  if (TUR_SITE) { $('#site-ad').textContent = TUR_SITE.ad + ' · konsept demo'; siteKutu.style.display = 'flex'; siteKutu.style.opacity = 0; bekle.push(new Promise(ok => { cerceve.onload = () => { const dene = () => (cerceve.contentWindow.HAZIR ? ok() : setTimeout(dene, 60)); dene(); }; cerceve.src = TUR_SITE.yol + '?tur=1'; setTimeout(ok, 25000); })); }
  await Promise.all(bekle); await new Promise(r => setTimeout(r, 300));   // dokular (demo ekran görüntüleri) yüklensin
  turKare(0); window.HAZIR = true;
} else {
  $('#yukleme').style.display = 'none'; let son = saat();
  // yavaş cihazda kendini hafifletir: gölgeyi seyrek günceller, çözünürlüğü düşürür
  renderer.shadowMap.autoUpdate = false; let kareNo = 0, ort = 16, olcek = Math.min(devicePixelRatio || 1, 1.5);
  const dongu = () => { const t = saat(), ham = t - son, dt = Math.min(.05, ham); son = t; ort = ort * .9 + ham * 1000 * .1;
    if (kareNo % 90 === 89) { if (ort > 50 && olcek > .5) { olcek = Math.max(.5, olcek * .75); renderer.setPixelRatio(olcek); renderer.setSize(innerWidth, innerHeight, false); } }
    renderer.shadowMap.needsUpdate = kareNo % (ort > 40 ? 6 : 2) === 0; kareNo++;
    yuru(Math.min(.1, ham)); yakinBul(); kameraOyuncu(); D.guncelle(t, { sevinc: t < sevincBit }); renderer.render(D.scene, cam); requestAnimationFrame(dongu); };
  kameraOyuncu(); D.guncelle(0); renderer.render(D.scene, cam); window.HAZIR = true; requestAnimationFrame(dongu);
  window.OFIS = { oyuncu, isinla, panelAc, siteAc, siteKapat, kararDurum: () => kararDurum };   // test için
}
