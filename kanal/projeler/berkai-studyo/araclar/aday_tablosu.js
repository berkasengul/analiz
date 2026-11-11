#!/usr/bin/env node
// Müşteri bulma ekibi: degerlendirme.json (elle yazılan karar) + olcum_<slug>.json (ölçüm) -> adaylar.json, aday_tablosu.csv
// Kullanım: node araclar/aday_tablosu.js gunler/<tarih>/03_musteri
const fs=require('fs'),path=require('path'); const dir=process.argv[2];
const deg=JSON.parse(fs.readFileSync(path.join(dir,'degerlendirme.json'),'utf8'));
const out=deg.adaylar.map(a=>{let o=null;try{o=JSON.parse(fs.readFileSync(path.join(dir,'olcum_'+a.slug+'.json'),'utf8'))}catch(e){}
  const d=o&&o.masaustu||{},m=o&&o.telefon||{};
  return {...a,olcum:o?{tarih:o.olcum_tarihi,platform:o.platform,durum:d.durum||null,masaustu_ilk_goruntu_ms:d.fcp_ms,masaustu_yukleme_ms:d.load_ms,telefon_ilk_goruntu_ms:m.fcp_ms,telefon_yukleme_ms:m.load_ms,telefon_yatay_tasma_px:m.yatay_tasma_px,viewport_meta:!!m.viewport_meta,istek:d.istek,gorsel:d.gorsel_sayisi,alt_metni_olmayan_gorsel:d.alt_yok,uc_boyut:(d.canvas||0)+(d.model_viewer||0)>0,kirik_baglanti:o.baglanti?o.baglanti.kirik:[],bakilan_baglanti:o.baglanti?o.baglanti.bakilan:0,ekran:{masaustu:'ekran/'+a.slug+'_masaustu.jpg',telefon:'ekran/'+a.slug+'_telefon.jpg'}}:null};});
fs.writeFileSync(path.join(dir,'adaylar.json'),JSON.stringify({tarih:deg.tarih,olcum_notu:deg.olcum_notu,adaylar:out,bulunamayanlar:deg.bulunamayanlar},null,1));
const q=s=>'"'+String(s==null?'':s).replace(/"/g,'""')+'"';
const rows=[['Öncelik','İşletme','Şehir','Sektör','Web','Platform','Telefonda ilk görüntü (sn)','Telefonda yükleme (sn)','Kırık bağlantı','Neden uygun / neden elendi','Demo fikri','Kurumsal e-posta (kaynak)','Instagram (kaynak: site)','Kural kontrolü','Durum','İlk mesaj','Hatırlatma 1 (+4 gün)','Hatırlatma 2 (+7 gün)','Not']];
for(const a of out){const o=a.olcum||{}; rows.push([a.oncelik,a.ad,a.sehir,a.sektor,a.web,o.platform||'',o.telefon_ilk_goruntu_ms!=null?(o.telefon_ilk_goruntu_ms/1000).toFixed(1).replace('.',','):'',o.telefon_yukleme_ms!=null?(o.telefon_yukleme_ms/1000).toFixed(1).replace('.',','):'',o.kirik_baglanti?o.kirik_baglanti.length+'/'+o.bakilan_baglanti:'',a.neden,a.demo_fikri||'',a.eposta?a.eposta+' ('+a.eposta_kaynak+')':'bulunamadı',a.instagram||'',a.kural,a.durum,'','','',a.not||'']);}
fs.writeFileSync(path.join(dir,'aday_tablosu.csv'),'﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n'));
console.log(out.length+' aday yazıldı');
