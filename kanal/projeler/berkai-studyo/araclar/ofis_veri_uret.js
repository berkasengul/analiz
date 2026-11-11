#!/usr/bin/env node
// Müdür: gunler/<tarih>/ altındaki gerçek çıktılardan ofis/veri.js üretir (ofisin panelleri bu dosyayı okur).
// Kullanım: node araclar/ofis_veri_uret.js [tarih]   (tarih verilmezse gunler/ altındaki en yeni gün)
const fs=require('fs'),path=require('path'); const KOK=path.resolve(__dirname,'..'),G=path.join(KOK,'gunler');
const gunler=fs.readdirSync(G).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort(); const tarih=process.argv[2]||gunler[gunler.length-1]; const D=path.join(G,tarih);
const oku=f=>fs.readFileSync(f,'utf8'), json=f=>JSON.parse(oku(f).replace(/^﻿/,''));
const AYLAR=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],GUN=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const dt=new Date(tarih+'T12:00:00Z'); const tarih_yazi=`${dt.getUTCDate()} ${AYLAR[dt.getUTCMonth()]} ${dt.getUTCFullYear()} ${GUN[dt.getUTCDay()]}`;
const KLASOR={konu:'01_konu',yapim:'02_yapim',musteri:'03_musteri',site:'04_site',mail:'05_mail',mudur:'06_mudur'};
const ekipler=[]; const eksik=[];
for(const [id,kl] of Object.entries(KLASOR)){
  const d=path.join(D,kl); if(!fs.existsSync(path.join(d,'ekip.json'))){eksik.push(kl+'/ekip.json'); continue;}
  const e=json(path.join(d,'ekip.json')); e.id=id; e.klasor=`gunler/${tarih}/${kl}`;
  const dosyalar=(e.belgeler||fs.readdirSync(d).filter(f=>/\.(md|txt|csv)$/.test(f)).sort());
  e.belgeler=dosyalar.filter(f=>fs.existsSync(path.join(d,f))).map(f=>{const s=oku(path.join(d,f)).replace(/^﻿/,''); return {ad:f,yol:`../gunler/${tarih}/${kl}/${f}`,tur:path.extname(f).slice(1),icerik:s.length>70000?s.slice(0,70000)+'\n\n[… dosyanın devamı diskte]':s};});
  ekipler.push(e);
}
// adaylar + siteler + kararlar
let adaylar=[],siteler=[],kararlar=[],onceki={};
try{ adaylar=json(path.join(D,'03_musteri','adaylar.json')).adaylar.map(a=>({slug:a.slug,oncelik:a.oncelik,ad:a.ad,sehir:a.sehir,sektor:a.sektor,web:a.web,neden:a.neden,durum:a.durum,eposta:a.eposta||null,olcum:a.olcum&&{platform:a.olcum.platform,tel_ilk:a.olcum.telefon_ilk_goruntu_ms,tel_yuk:a.olcum.telefon_yukleme_ms,kirik:a.olcum.kirik_baglanti.length},ekran:a.olcum?`../gunler/${tarih}/03_musteri/${a.olcum.ekran.masaustu}`:null,ekran_tel:a.olcum?`../gunler/${tarih}/03_musteri/${a.olcum.ekran.telefon}`:null})); }catch(e){eksik.push('03_musteri/adaylar.json')}
try{ for(const f of fs.readdirSync(path.join(D,'04_site')).filter(f=>/^test_.*\.json$/.test(f))){ const t=json(path.join(D,'04_site',f)); let ad=t.slug; try{ad=json(path.join(KOK,'siteler','_motor','markalar',t.slug+'.json')).marka}catch(e){}
  siteler.push({slug:t.slug,ad,yol:`../siteler/${t.slug}/index.html`,gorsel:`../gunler/${tarih}/04_site/ekran/${t.slug}_tur_0.jpg`,gecti:t.gecti,sonuc:t.sonuc,tur_sure:t.tur.sure,kb:t.klasor_kb}); } }catch(e){eksik.push('04_site/test_*.json')}
{ const sira=adaylar.map(a=>a.slug); const yer=s=>{const i=sira.findIndex(x=>s.slug.replace(/-/g,'').startsWith(x.replace(/-/g,'')));return i<0?99:i}; siteler.sort((a,b)=>yer(a)-yer(b)); }
try{ kararlar=json(path.join(D,'06_mudur','kararlar_bekleyen.json')).kararlar; }catch(e){eksik.push('06_mudur/kararlar_bekleyen.json')}
try{ onceki=json(path.join(D,'kararlar.json')); }catch(e){}
const V={uretim:new Date().toISOString(),tarih,tarih_yazi,gunler,ekipler,adaylar,siteler,kararlar,verilmis_kararlar:onceki.kararlar||null,eksik};
fs.writeFileSync(path.join(KOK,'ofis','veri.js'),'// OTOMATİK ÜRETİLDİ: node araclar/ofis_veri_uret.js — elle düzenleme, gunler/ altındaki dosyaları düzenle.\nwindow.OFIS_VERI='+JSON.stringify(V)+';\n');
console.log(`ofis/veri.js yazıldı: ${tarih}, ${ekipler.length} ekip, ${ekipler.reduce((s,e)=>s+e.belgeler.length,0)} belge, ${adaylar.length} aday, ${siteler.length} site, ${kararlar.length} karar${eksik.length?' · EKSİK: '+eksik.join(', '):''}`);
