// BerkAİ Stüdyo 3D ofisi: üçüncü şahıs yürüme, sade paneller, kararlar, demo penceresi (ZIP bağlantılı) ve tur.
// Veri: veri.js (window.OFIS_VERI) -> node araclar/ofis_veri_uret.js. Yayın paketinde window.OFIS_YAYIN = true olur.
import * as THREE from 'three';
import { kur, YERLER, SINIR, BOLME, hangiBolme } from './dunya.js';

const V = window.OFIS_VERI, YAYIN = !!window.OFIS_YAYIN, KOK = YAYIN ? '' : '../';
const TUR_MODU = new URLSearchParams(location.search).get('tur') === '1' || /tur/.test(location.hash) || !!window.OFIS_TUR;
const GITHUB_ZIP = 'https://github.com/berkasengul/analiz/raw/claude/nifty-maxwell-fmmq61/kanal/projeler/berkai-studyo/';
if (TUR_MODU) document.documentElement.classList.add('tur');
const $ = s => document.querySelector(s), el = (t, o = {}, ...c) => { const e = Object.assign(document.createElement(t), o); e.append(...c); return e; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), yum = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }, lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const E = Object.fromEntries(V.ekipler.map(e => [e.id, e])), SIRA = ['konu', 'yapim', 'musteri', 'site', 'mail', 'mudur'].filter(i => E[i]);
$('#tarih').textContent = V.tarih_yazi;
const depo = { al(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, yaz(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* depolama kapalı */ } } };

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


// ---------- kararlar ----------
const ANAHTAR = 'berkai_kararlar_' + V.tarih;
let kararDurum = {};
for (const k of V.verilmis_kararlar || []) kararDurum[k.id] = { karar: k.karar, not: k.not || '' };
if (!TUR_MODU) { try { const s = depo.al(ANAHTAR); if (s) Object.assign(kararDurum, JSON.parse(s)); } catch (e) { /* bozuk kayıt */ } }
const kararKaydet = () => { if (!TUR_MODU) depo.yaz(ANAHTAR, JSON.stringify(kararDurum)); };
function kararDisaAktar() {
  const veri = { tarih: V.tarih, disa_aktarim: new Date().toISOString(), aciklama: `Bu dosyayı gunler/${V.tarih}/kararlar.json olarak kaydet; GUNLUK_KOMUT yarın buradan devam eder.`, kararlar: V.kararlar.map(k => ({ id: k.id, baslik: k.baslik, karar: (kararDurum[k.id] || {}).karar || 'bekliyor', not: (kararDurum[k.id] || {}).not || '' })) };
  const metin = JSON.stringify(veri, null, 2);
  if (!YAYIN) { try { const a = el('a', { href: URL.createObjectURL(new Blob([metin], { type: 'application/json' })), download: 'kararlar.json' }); document.body.append(a); a.click(); a.remove(); return; } catch (e) { /* aşağıdaki pencereye düş */ } }
  // yayın sayfasında indirme engelli: metni göster, kullanıcı kopyalasın
  $('#okur-ad').textContent = 'kararlar.json'; const ic = $('#okur-ic'); ic.innerHTML = `<p>Bu sayfadan dosya indirilemiyor. Aşağıdaki metni kopyala, <code>gunler/${esc(V.tarih)}/kararlar.json</code> olarak kaydet.</p>`;
  const ta = el('textarea', { className: 'aktar-kutu', value: metin, readOnly: true }); ic.append(ta, el('p', {}, el('button', { className: 'dugme ana', textContent: 'Kopyala', onclick: () => { ta.select(); try { navigator.clipboard.writeText(metin).catch(() => document.execCommand('copy')); } catch (e) { try { document.execCommand('copy'); } catch (e2) { /* elle kopyalanır */ } } } })));
  $('#okur').classList.add('acik'); ta.select();
}

// ---------- okuyucu (uzun metinler tıklayınca açılır) ----------
function belgeAc(id, ad) { const d = E[id].belgeler.find(b => b.ad === ad) || E[id].belgeler.find(b => ad.endsWith(b.ad)); if (!d) return; $('#okur-ad').textContent = E[id].ad + ' · ' + d.ad; $('#okur-ic').innerHTML = belgeHtml(d); $('#okur-ic').scrollTop = 0; $('#okur').classList.add('acik'); }
function gorselAc(src, ad) { $('#okur-ad').textContent = ad; $('#okur-ic').innerHTML = `<p><img src="${esc(src)}" alt="${esc(ad)}" style="max-width:100%;border-radius:10px"></p>`; $('#okur').classList.add('acik'); }
const okurKapat = () => $('#okur').classList.remove('acik'); $('#okur-kapat').onclick = okurKapat; $('#okur').addEventListener('click', e => { if (e.target.id === 'okur') okurKapat(); });

// ---------- panel: özet + sayılar + bugünün işleri ----------
const panel = $('#panel'); let acikPanel = null, kararCiz = () => { };
function panelKur(id) {
  const e = E[id], renk = YERLER[id].renk; panel.innerHTML = '';
  panel.append(el('header', {}, el('span', { className: 'renk', style: `background:${renk}` }), el('div', {}, el('p', { className: 'kucuk', textContent: YERLER[id].no + ' · ' + V.tarih_yazi }), el('h2', { textContent: e.ad })), el('button', { textContent: 'Kapat', onclick: () => panelAc(null) })));
  const g = el('div', { className: 'govde' }); panel.append(g);
  g.append(el('p', { className: 'ozet', textContent: e.ozet }));
  if (e.rakamlar) g.append(el('div', { className: 'rakamlar', innerHTML: e.rakamlar.slice(0, 4).map(r => `<div><b>${esc(r.d)}</b><span>${esc(r.e)}</span></div>`).join('') }));
  if (id === 'mudur') kararlarKur(g);
  if (id === 'site' && V.siteler.length) {
    g.append(el('h3', { textContent: 'Demo siteler' })); const k = el('div', { className: 'kartlar' });
    for (const s of V.siteler) { const a = el('article', { innerHTML: `<img src="${esc(KOK + s.gorsel)}" alt="${esc(s.ad)} demo sitesi"><div class="ic"><h4>${esc(s.ad)}</h4><p><span class="rozet ${s.gecti ? 'gecti' : ''}">${s.gecti ? 'testten geçti' : 'kalan var'}</span>${Object.values(s.sonuc).filter(Boolean).length}/${Object.keys(s.sonuc).length} kontrol</p></div>` }); a.querySelector('.ic').append(el('button', { className: 'dugme ana', textContent: 'Demoyu aç', onclick: () => siteAc(s) })); a.querySelector('img').onclick = () => siteAc(s); k.append(a); }
    g.append(k);
  }
  if (id === 'musteri' && V.adaylar.length) {
    g.append(el('h3', { textContent: 'En güçlü adaylar' })); const k = el('div', { className: 'kartlar' });
    for (const a of V.adaylar.filter(a => a.oncelik === 'A')) { const o = a.olcum, art = el('article', { innerHTML: (a.ekran ? `<img loading="lazy" src="${esc(KOK + a.ekran)}" alt="${esc(a.ad)} sitesi">` : '') + `<div class="ic"><h4>${esc(a.ad)}</h4><p>${esc(a.sektor)} · ${esc(a.sehir)}</p><p><strong>${esc(a.durum)}</strong></p></div>` }); const im = art.querySelector('img'); if (im) im.onclick = () => gorselAc(KOK + a.ekran, a.ad + ' · şu anki sitesi'); k.append(art); }
    g.append(k);
  }
  g.append(el('h3', { textContent: 'Bugünün işleri' })); const ul = el('ul', { className: 'isler' });
  const gorulen = new Set();
  for (const c of e.calisanlar || []) { const d = c.cikti && e.belgeler.find(b => c.cikti.endsWith(b.ad)); if (d) gorulen.add(d.ad); const b = el('button', { innerHTML: `<b>${esc(c.rol)}</b><span>${esc(c.is)}</span>${d ? `<em>Aç: ${esc(d.ad)}</em>` : ''}` }); if (d) b.onclick = () => belgeAc(id, d.ad); ul.append(el('li', {}, b)); }
  for (const d of e.belgeler) if (!gorulen.has(d.ad)) ul.append(el('li', {}, el('button', { innerHTML: `<b>${esc(d.ad)}</b><em>Aç</em>`, onclick: () => belgeAc(id, d.ad) })));
  g.append(ul);
}
function kararlarKur(g) {
  g.append(el('h3', { textContent: `Onayını bekleyen kararlar (${V.kararlar.length})` })); const kutu = el('div', { id: 'kararlar' }); g.append(kutu);
  const sayac = el('span'), akt = el('div', { className: 'aktar' }, el('button', { className: 'dugme ana', textContent: 'Kararları dışa aktar', onclick: kararDisaAktar }), sayac);
  const ciz = () => { kutu.innerHTML = ''; for (const k of V.kararlar) { const d = kararDurum[k.id] || {}, a = el('div', { className: 'karar ' + (d.karar || '') });
      a.append(el('h4', { textContent: k.id + ' · ' + k.baslik }), el('p', { className: 'soru', textContent: k.soru }), el('p', { className: 'gerekce', textContent: 'Müdürün önerisi: ' + k.oneri + '. ' + k.gerekce }));
      const s = el('div', { className: 'satir' }), on = el('button', { className: 'dugme onayla' + (d.karar === 'onay' ? ' sec' : ''), textContent: 'Onayla' }), re = el('button', { className: 'dugme reddet' + (d.karar === 'ret' ? ' sec' : ''), textContent: 'Reddet' });
      on.onclick = () => { kararDurum[k.id] = { ...d, karar: d.karar === 'onay' ? undefined : 'onay' }; kararKaydet(); ciz(); if (kararDurum[k.id].karar) sevincBit = saat() + 2.4; };
      re.onclick = () => { kararDurum[k.id] = { ...d, karar: d.karar === 'ret' ? undefined : 'ret' }; kararKaydet(); ciz(); };
      const nt = el('input', { placeholder: 'Not (isteğe bağlı)', value: d.not || '' }); nt.oninput = () => { kararDurum[k.id] = { ...(kararDurum[k.id] || {}), not: nt.value }; kararKaydet(); };
      s.append(on, re, el('span', { className: 'durum', textContent: d.karar === 'onay' ? 'Onaylandı' : d.karar === 'ret' ? 'Reddedildi' : 'Bekliyor' }), nt); a.append(s); kutu.append(a); }
    sayac.textContent = `${V.kararlar.filter(k => (kararDurum[k.id] || {}).karar).length}/${V.kararlar.length} karar verildi`; };
  ciz(); kararCiz = ciz; queueMicrotask(() => panel.querySelector('.govde').append(akt));
}
function panelAc(id) { if (id === acikPanel) return; acikPanel = id; if (id) { panelKur(id); panel.querySelector('.govde').scrollTop = 0; } panel.classList.toggle('acik', !!id); }

// ---------- demo site penceresi ----------
const siteKutu = $('#site'), cerceve = $('#site-cerceve'); let acikSite = null;
function siteBaslik(s) { $('#site-ad').textContent = s.ad + ' · konsept demo'; const y = $('#site-yeni'); y.href = KOK + s.yol; const z = $('#site-zip'); if (YAYIN) { z.href = GITHUB_ZIP + s.zip; z.target = '_blank'; z.rel = 'noopener'; z.removeAttribute('download'); } else { z.href = KOK + s.zip; z.setAttribute('download', s.slug + '-Netlify.zip'); z.removeAttribute('target'); } z.title = 'Netlify Drop\'a sürüklenecek paket'; }
function siteAc(s) { acikSite = s; siteBaslik(s); if (!TUR_MODU) cerceve.src = KOK + s.yol; siteKutu.classList.add('acik'); }
function siteKapat() { acikSite = null; siteKutu.classList.remove('acik'); if (!TUR_MODU) cerceve.src = 'about:blank'; }
$('#site-kapat').onclick = siteKapat; siteKutu.addEventListener('click', e => { if (e.target === siteKutu) siteKapat(); });

// ---------- sahne ----------
const canvas = $('#c'), renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: TUR_MODU, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const cam = new THREE.PerspectiveCamera(56, 1, .08, 220);
let olcek = Math.min(devicePixelRatio || 1, 1.5);
function boyut() { renderer.setPixelRatio(TUR_MODU ? 1 : olcek); renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
addEventListener('resize', boyut); boyut();
const t0 = performance.now(), saat = () => (performance.now() - t0) / 1000; let sevincBit = -1;
let D;
try { D = await kur(renderer, V, null, KOK); }
catch (e) { $('#yuk-yazi').textContent = 'Ofis açılamadı.'; $('#yuk-hata').textContent = 'Dosyalar bir web sunucusundan açılmalı (README.md → "Ofisi açmak"). Ayrıntı: ' + e.message; throw e; }

// ---------- oyuncu (üçüncü şahıs) ----------
const oyuncu = { x: 0, z: 10.6, yaw: Math.PI, kamYaw: 0, kamPitch: .3, yuruyor: false, adimT: 0 }, tus = {}, kol = { x: 0, y: 0 };
const yaziyor = () => /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
const ortuAcik = () => acikSite || $('#okur').classList.contains('acik') || $('#nasil').classList.contains('acik');
function eTusu() { if ($('#nasil').classList.contains('acik')) return nasilKapat(); if ($('#okur').classList.contains('acik')) return okurKapat(); if (acikSite) return siteKapat(); if (acikPanel) return panelAc(null); if (yakinSite) return siteAc(yakinSite); if (yakin) panelAc(yakin); }
addEventListener('keydown', e => { if (yaziyor()) { if (e.key === 'Escape') document.activeElement.blur(); return; } const k = e.key.toLowerCase(); tus[k] = true;
  if (k === 'escape') { if ($('#nasil').classList.contains('acik')) nasilKapat(); else if ($('#okur').classList.contains('acik')) okurKapat(); else if (acikSite) siteKapat(); else panelAc(null); }
  if (k === 'e' || k === 'enter') eTusu();
  if (/^[1-6]$/.test(k) && SIRA[+k - 1] && !ortuAcik()) isinla(SIRA[+k - 1]);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault(); });
addEventListener('keyup', e => { tus[e.key.toLowerCase()] = false; }); addEventListener('blur', () => { for (const k in tus) tus[k] = false; });
const durus = id => id === 'mudur' ? [0, -7.5] : [BOLME[id].yan * 3.3, YERLER[id].z + 1.0];
function isinla(id) { const [x, z] = durus(id), y = YERLER[id]; oyuncu.x = x; oyuncu.z = z; oyuncu.yaw = Math.atan2(y.x - x, (id === 'mudur' ? -9.9 : y.z) - z); oyuncu.kamYaw = oyuncu.yaw + Math.PI; oyuncu.kamPitch = .3; panelAc(null); }
let sur = null, oynadi = 0;
canvas.addEventListener('pointerdown', e => { sur = { x: e.clientX, y: e.clientY, yaw: oyuncu.kamYaw, pitch: oyuncu.kamPitch }; oynadi = 0; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* yok say */ } canvas.classList.add('surukle'); });
canvas.addEventListener('pointermove', e => { if (!sur) return; const dx = e.clientX - sur.x, dy = e.clientY - sur.y; oynadi = Math.max(oynadi, Math.abs(dx) + Math.abs(dy)); oyuncu.kamYaw = sur.yaw - dx * .0045; oyuncu.kamPitch = clamp(sur.pitch + dy * .0035, -.15, 1.15); });
const isin = new THREE.Raycaster(), fare = new THREE.Vector2();
canvas.addEventListener('pointerup', e => { canvas.classList.remove('surukle'); if (sur && oynadi < 8) { fare.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); isin.setFromCamera(fare, cam); const h = isin.intersectObjects(D.ekranlar)[0]; if (h && h.distance < 22) siteAc(h.object.userData.site); } sur = null; });
canvas.addEventListener('pointercancel', () => { sur = null; canvas.classList.remove('surukle'); });
const R = .32, carpar = (x, z) => x < SINIR.x0 || x > SINIR.x1 || z < SINIR.z0 || z > SINIR.z1 || D.engeller.some(b => x > b[0] - R && x < b[1] + R && z > b[2] - R && z < b[3] + R);
function yuru(dt) {
  oyuncu.yuruyor = false; if (yaziyor() || ortuAcik()) return;
  let ileri = (tus.w || tus.arrowup ? 1 : 0) - (tus.s || tus.arrowdown ? 1 : 0) - kol.y, yan = (tus.d ? 1 : 0) - (tus.a ? 1 : 0) + kol.x; const don = (tus.arrowright ? 1 : 0) - (tus.arrowleft ? 1 : 0);
  oyuncu.kamYaw -= don * dt * 1.9; const buy = Math.hypot(ileri, yan); if (buy < .15) return;
  // kameranın baktığı yöne göre hareket
  const fx = -Math.sin(oyuncu.kamYaw), fz = -Math.cos(oyuncu.kamYaw), sx = -fz, sz = fx, hiz = (tus.shift ? 5.6 : 3.3) * Math.min(1, buy) * dt / buy;
  const dx = (fx * ileri + sx * yan) * hiz, dz = (fz * ileri + sz * yan) * hiz;
  if (!carpar(oyuncu.x + dx, oyuncu.z)) oyuncu.x += dx; if (!carpar(oyuncu.x, oyuncu.z + dz)) oyuncu.z += dz;
  const hedef = Math.atan2(dx, dz); let fark = hedef - oyuncu.yaw; fark = Math.atan2(Math.sin(fark), Math.cos(fark)); oyuncu.yaw += fark * Math.min(1, dt * 12);
  oyuncu.yuruyor = true; oyuncu.adimT += dt * (tus.shift ? 1.5 : 1);
}
// kamera: karakterin arkasında, hafif yukarıda; duvarın ya da camın içine girmez
const kamHedef = new THREE.Vector3();
function kameraOyuncu() {
  const cp = Math.cos(oyuncu.kamPitch), bx = Math.sin(oyuncu.kamYaw) * cp, bz = Math.cos(oyuncu.kamYaw) * cp, by = Math.sin(oyuncu.kamPitch), ox = oyuncu.x, oy = 1.5, oz = oyuncu.z; let d = 3.6;
  for (let u = .3; u <= 3.6; u += .15) { const x = ox + bx * u, z = oz + bz * u, y = oy + by * u; if (x < -10.75 || x > 10.75 || z < -11.75 || z > 11.75 || y > 3.95 || D.engeller.some(b => b[4] && x > b[0] - .15 && x < b[1] + .15 && z > b[2] - .15 && z < b[3] + .15)) { d = Math.max(.5, u - .2); break; } }
  cam.position.set(ox + bx * d, oy + by * d, oz + bz * d); kamHedef.set(ox, 1.45, oz); cam.lookAt(kamHedef);
}
let yakin = null, yakinSite = null; const ipucu = $('#ipucu');
function yakinBul() { yakin = hangiBolme(oyuncu.x, oyuncu.z); if (yakin && !E[yakin]) yakin = null; yakinSite = null;
  if (yakin === 'site') for (const s of V.siteler) if (s._x !== undefined && Math.hypot(oyuncu.x - s._x, oyuncu.z - s._z) < 2.2 && oyuncu.x > 7.4) yakinSite = s;
  const goster = (yakin || yakinSite) && !acikPanel && !ortuAcik(); ipucu.hidden = !goster; if (goster) ipucu.innerHTML = yakinSite ? `<kbd>E</kbd> ${esc(yakinSite.ad)} demosunu aç` : `<kbd>E</kbd> ${esc(E[yakin].ad)}: ${yakin === 'mudur' ? 'raporu oku, kararlarını ver' : 'bugün ne yaptı?'}`; }
const ek = $('#ekipler'); SIRA.forEach((id, i) => ek.append(el('button', { innerHTML: `<i style="background:${YERLER[id].renk}"></i>${i + 1} · ${esc(E[id].kisa)}`, onclick: () => { isinla(id); } })));
// nasıl gezilir kartı (bir kez)
function nasilKapat() { $('#nasil').classList.remove('acik'); depo.yaz('berkai_nasil', '1'); }
$('#nasil-kapat').onclick = nasilKapat;
// dokunmatik: sanal kol + E düğmesi; bakmak için ekranı sürükle
{ const kutu = $('#dokun'), k = $('#kol'), top = k.firstElementChild; let id = null;
  const ac = () => { kutu.hidden = false; $('#yardim').textContent = 'Sol kol: yürü · sürükle: bak · E: aç'; };
  if (!TUR_MODU && (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0)) ac(); addEventListener('touchstart', () => { if (!TUR_MODU) ac(); }, { once: true, passive: true });
  const oku = e => { const r = k.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; } kol.x = x; kol.y = y; top.style.transform = `translate(${x * 34}px,${y * 34}px)`; };
  k.addEventListener('pointerdown', e => { id = e.pointerId; try { k.setPointerCapture(id); } catch (err) { /* yok say */ } oku(e); e.preventDefault(); });
  k.addEventListener('pointermove', e => { if (e.pointerId === id) oku(e); });
  const birak = () => { id = null; kol.x = kol.y = 0; top.style.transform = ''; }; k.addEventListener('pointerup', birak); k.addEventListener('pointercancel', birak);
  $('#dokun-e').onclick = eTusu; }

// ---------- tur: her şey t'nin fonksiyonu ----------
const saga = (P, S, derece) => { const dx = S[0] - P[0], dz = S[2] - P[2], q = derece * Math.PI / 180, c = Math.cos(q), n = Math.sin(q); return [P[0] + dx * c - dz * n, S[1], P[2] + dz * c + dx * n]; };
// duraklar: [ad, bas, bit, oyuncu x,z, baktığı x,z, kamera x,y,z, kamera hedefi x,y,z, panel]
const DURAK = []; { const ekle = (id, bas, bit) => { const b = BOLME[id], y = YERLER[id], zc = y.z, o = [b.yan * 3.3, zc + 1.2], P = [-b.yan * .9, 2.25, zc + 3.4], S = [b.yan * 6.2, 1.0, zc - .3]; DURAK.push({ id, ad: E[id].ad, bas, bit, o, yuz: [b.yan * 6.5, zc - .3], P, L: saga(P, S, b.yan < 0 ? 20 : 24), panel: id }); };
  DURAK.push({ ad: 'Giriş', bas: 0, bit: 6, o: [0, 8.4], yuz: [0, -10], P: [0, 2.5, 11.3], L: [0, 1.0, 1], P0: [0, 3.0, 11.6], o0: [0, 10.6] });
  ekle('konu', 6, 18); ekle('yapim', 18, 30); ekle('musteri', 30, 42); ekle('site', 42, 54);
  const s0 = V.siteler[0] || { _x: 9.3, _z: 7, ad: '—' };
  DURAK.push({ ad: 'Demo site ekranda: ' + s0.ad, bas: 54, bit: 69, o: [8.3, s0._z + 1.5], yuz: [11, s0._z], P: [6.6, 2.0, s0._z + .5], L: [11, 1.95, s0._z], demo: true });
  ekle('mail', 69, 81);
  DURAK.push({ id: 'mudur', ad: 'Müdür odası: karar onayı', bas: 81, bit: 100, o: [-.7, -7.7], yuz: [0, -10.5], P: [0.5, 2.3, -4.7], L: saga([0.5, 2.3, -4.7], [-.4, 1.1, -9.6], 21), panel: 'mudur' });
  DURAK.push({ ad: 'Kapanış', bas: 100, bit: 107, o: [0, -4.5], yuz: [0, 10], P: [0, 2.6, 10.6], L: [0, 1.5, -8], P0: [0, 3.3, 11.6], kesme: true }); }
const GECIS = 3.2, SITE_BAS = 57.4, SITE_BIT = 68.6, ONAY_T = 92.6, TUR_SITE = V.siteler[0];
const imlec = $('#imlec'); let turPanel = null, turOnay = null; const v3 = new THREE.Vector3();
// koridor üzerinden yürüyüş yolu: önce koridora çık, koridorda ilerle, bölmeye gir
const yolNoktalari = (a, b) => { const p = [a]; if (Math.abs(a[0]) > .3) p.push([0, a[1]]); if (Math.abs(b[0]) > .3 || Math.abs(a[1] - b[1]) > .01) p.push([0, b[1]]); p.push(b); return p; };
function yolda(p, u) { const L = []; let top = 0; for (let i = 0; i < p.length - 1; i++) { const d = Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); L.push(d); top += d; } if (top < .01) return [p[0][0], p[0][1], null]; let s = u * top, i = 0; while (i < L.length - 1 && s > L[i]) { s -= L[i]; i++; } const q = L[i] ? s / L[i] : 0; return [lerp(p[i][0], p[i + 1][0], q), lerp(p[i][1], p[i + 1][1], q), Math.atan2(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]), top]; }
function turKare(t) {
  t = clamp(t, 0, 107); let i = DURAK.findIndex(d => t < d.bit); if (i < 0) i = DURAK.length - 1; const d = DURAK[i], onceki = DURAK[i - 1], yerel = t - d.bas;
  let ox, oz, oyaw, yuruyor = false, adim = 0; const yuzYaw = Math.atan2(d.yuz[0] - d.o[0], d.yuz[1] - d.o[1]);
  const basla = d.o0 || (onceki && !d.kesme ? onceki.o : d.o), yol = yolNoktalari(basla, d.o), sure = d.o0 ? 4.2 : GECIS;
  if (yerel < sure && (d.o0 || (onceki && !d.kesme))) { const u = yerel / sure, r = yolda(yol, u); ox = r[0]; oz = r[1]; oyaw = r[2] === null ? yuzYaw : r[2]; yuruyor = r[2] !== null; adim = u * (r[3] || 0) / 3.3 * 1.0; }
  else { ox = d.o[0]; oz = d.o[1]; const q = yum((yerel - sure) / .5); const son = yolda(yol, 1)[2]; let f = yuzYaw - (son === null ? yuzYaw : son); f = Math.atan2(Math.sin(f), Math.cos(f)); oyaw = yuzYaw - f * (1 - q); }
  // kamera
  const P0 = d.P0 || (onceki && !d.kesme ? onceki.P : d.P), L0 = d.P0 ? d.L : (onceki && !d.kesme ? onceki.L : d.L), u = yum(yerel / (d.P0 ? d.bit - d.bas : GECIS + .4));
  cam.position.set(lerp(P0[0], d.P[0], u), lerp(P0[1], d.P[1], u), lerp(P0[2], d.P[2], u)); v3.set(lerp(L0[0], d.L[0], u), lerp(L0[1], d.L[1], u), lerp(L0[2], d.L[2], u)); cam.lookAt(v3);
  // panel
  let pid = null, kay = 0; if (d.panel && E[d.panel]) { const s = d.bas + GECIS + .6, e = d.bit - .5; if (t >= s && t <= e) { pid = d.panel; kay = Math.min(yum((t - s) / .6), yum((e - t) / .5)); } }
  if (pid !== turPanel) { turPanel = pid; acikPanel = null; if (pid) { panelKur(pid); acikPanel = pid; } turOnay = null; }
  panel.style.transform = `translateX(${(1 - (pid ? kay : 0)) * 102}%)`; if (pid) panel.querySelector('.govde').scrollTop = 0;
  let sevinc = false;
  if (pid === 'mudur' && V.kararlar.length) { const k1 = V.kararlar[0], onay = t >= ONAY_T; if (onay !== turOnay) { turOnay = onay; kararDurum = onay ? { [k1.id]: { karar: 'onay' } } : {}; kararCiz(); }
    const dg = panel.querySelector('.karar .onayla'); if (dg && t > 89.8 && t < 95.5) { const r = dg.getBoundingClientRect(), q = yum((t - 89.8) / 2.2); imlec.hidden = false; imlec.style.left = lerp(innerWidth * .46, r.left + r.width * .55, q) + 'px'; imlec.style.top = lerp(innerHeight * .8, r.top + r.height * .55, q) + (t >= ONAY_T && t < ONAY_T + .25 ? 3 : 0) + 'px'; } else imlec.hidden = true; sevinc = t >= ONAY_T && t < ONAY_T + 4.2; } else imlec.hidden = true;
  const sg = TUR_SITE ? Math.min(yum((t - SITE_BAS) / .5), yum((SITE_BIT - t) / .5)) : 0; siteKutu.style.display = sg > 0 ? 'flex' : 'none'; siteKutu.style.opacity = sg;
  if (sg > 0) { try { const w = cerceve.contentWindow; if (w && w.TUR) w.TUR.kare(clamp(t - SITE_BAS - .2, 0, w.TUR.sure)); } catch (e) { /* çerçeve hazır değil */ } }
  D.guncelle(t, { sevinc, oyuncu: { x: ox, z: oz, yaw: oyaw, yuruyor, adimT: adim } }); renderer.render(D.scene, cam); return t;
}

window.OFIS_BAK = (p, l, t = 3) => { cam.position.set(...p); v3.set(...l); cam.lookAt(v3); D.guncelle(t, { oyuncu: { x: 0, z: 9, yaw: Math.PI, yuruyor: true, adimT: t } }); renderer.render(D.scene, cam); };   // test: serbest kamera
// ---------- başlat ----------
$('#yukleme').style.display = 'none';
if (TUR_MODU) {
  window.TUR = { sure: 107, sahneler: DURAK.map(d => ({ ad: d.ad, bas: d.bas, bit: d.bit })), kare: turKare };
  const bekle = [document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 500))];
  if (TUR_SITE) { siteBaslik(TUR_SITE); siteKutu.style.display = 'flex'; siteKutu.style.opacity = 0; bekle.push(new Promise(ok => { cerceve.onload = () => { const dene = () => { try { if (cerceve.contentWindow.HAZIR) return ok(); } catch (e) { return ok(); } setTimeout(dene, 60); }; dene(); }; cerceve.src = KOK + TUR_SITE.yol + '?tur=1'; setTimeout(ok, 25000); })); }
  await Promise.all(bekle); await new Promise(r => setTimeout(r, 300));
  turKare(0); window.HAZIR = true;
} else {
  if (!depo.al('berkai_nasil')) $('#nasil').classList.add('acik');
  renderer.shadowMap.autoUpdate = false; let son = saat(), kareNo = 0, ort = 16;
  const dongu = () => { const t = saat(), ham = t - son; son = t; ort = ort * .9 + ham * 1000 * .1;
    if (kareNo % 90 === 89 && ort > 50 && olcek > .5) { olcek = Math.max(.5, olcek * .75); boyut(); }
    renderer.shadowMap.needsUpdate = kareNo % (ort > 40 ? 6 : 2) === 0; kareNo++;
    yuru(Math.min(.1, ham)); yakinBul(); kameraOyuncu(); D.guncelle(t, { sevinc: t < sevincBit, oyuncu }); renderer.render(D.scene, cam); requestAnimationFrame(dongu); };
  kameraOyuncu(); D.guncelle(0, { oyuncu }); renderer.render(D.scene, cam); window.HAZIR = true; requestAnimationFrame(dongu);
  window.OFIS = { oyuncu, isinla, panelAc, siteAc, siteKapat, belgeAc, kararDurum: () => kararDurum };
}
