// Ürün sahnesinin ilk görüntüsü: sayfa JavaScript'i yüklenmeden, tarayıcının ilk çiziminde 3B paketin kendi render'ı
// (public/img/snap, scripts/snap.cjs ile üretilir) 3B paketin duracağı yer ve boyda görünür; 3B hazır olunca fark edilmeden yerini alır.
// urun.html ve urunler.html içindeki <!-- early --> … <!-- /early --> arasını yeniden üretir.
// Kullanım: node scripts/early.mjs  (ürün, görsel, renk ya da snap.json değişince çalıştırın)
import { readFileSync, writeFileSync } from 'node:fs';
import { FLAVORS } from '../src/data.js';

const snap = JSON.parse(readFileSync(new URL('./snap.json', import.meta.url), 'utf8'));
// çekimdeki görüntü alanının en/boy oranı (1920x960 pencere)
const CAP_A = 2.193;
const r = (x) => Math.round(x * 1000) / 10; // 0..1 → yüzde, bir ondalık
const map = {};
for (const f of FLAVORS) {
  const s = snap[f.id];
  // [görsel, zemin rengi, masaüstü boy %, masaüstü dikey merkez %, telefon boy %, telefon dikey merkez %]
  // yatay kayma (kitlerde model dönüş merkezinin hafif sağında): paket boyuna oranla, ekran oranından bağımsız
  const dx = s ? Math.round(((s.d.cx - snap.anka.d.cx) * CAP_A / s.d.h) * 1000) / 1000 : 0;
  map[f.id] = s ? [`/img/snap/${f.id}.webp`, f.bg, r(s.d.h), r(s.d.cy), r(s.m.h), r(s.m.cy), dx] : [f.md, f.bg, 66.9, 49, 47.1, 43.3, 0];
}
const first = {};
for (const f of FLAVORS) if (!first[f.group]) first[f.group] = f.id;
first.tum = FLAVORS[0].id;

const code = (page) => `<!-- early --><script>(function(){var M=${JSON.stringify(map)},F=${JSON.stringify(first)},q=new URLSearchParams(location.search),id=${page === 'urun' ? "q.get('id')" : "F[q.get('kat')]||F.tum"};if(!M[id])id=F.tum;var e=M[id],s=document.getElementById('pstage'),i=document.getElementById('pimg');if(!e||!s||!i)return;i.src=e[0];s.style.setProperty('--c',e[1]);s.style.setProperty('--zemin','url(/img/zemin/'+id+'.webp)');window.__early=function(nid){if(M[nid]){e=M[nid];i.src=e[0];window.__fit();}};`
  + "window.__fit=function(){var v=s.querySelector('.pstage__view')||s,vr=v.getBoundingClientRect();if(!vr.width||!vr.height)return;var A=vr.width/vr.height,ph=innerWidth<760||innerWidth/innerHeight<0.9,h,cy,cx=50;"
  // telefon: paket boyu görüntü alanının yüksekliğine bağlı (çok dar ekranda genişliğe); masaüstü: genişlik sınırlıysa orantılı küçülür
  + "if(ph){h=e[4]*Math.min(1,A*1.757);cy=e[5];}"
  + "else{var k=Math.min(1,A*0.5714);h=e[2]*k;cy=e[3];var pl=s.querySelector('.pstage__panel'),th=document.getElementById('pThumbs');if(pl&&th){var a=pl.getBoundingClientRect(),b=th.getBoundingClientRect();if(a.width&&b.width){cx=Math.min(70,Math.max(50,((a.right+b.left)/2-vr.left)/vr.width*100));}}cx+=(e[6]||0)*h/A;}"
  + "s.style.setProperty('--cx',cx.toFixed(2)+'%');s.style.setProperty('--py',cy.toFixed(2)+'%');s.style.setProperty('--ph',h.toFixed(2)+'%');};window.__fit();addEventListener('resize',window.__fit);})();</script><!-- /early -->";

for (const [file, page] of [['urun.html', 'urun'], ['urunler.html', 'urunler']]) {
  let s = readFileSync(file, 'utf8');
  const block = code(page);
  if (s.includes('<!-- early -->')) s = s.replace(/<!-- early -->[\s\S]*?<!-- \/early -->/, () => block);
  else {
    const a = s.indexOf('<section class="pstage');
    const b = s.indexOf('\n    </section>', a) + '\n    </section>'.length;
    s = s.slice(0, b) + `\n    ${block}` + s.slice(b);
  }
  writeFileSync(file, s);
  console.log(file, 'ok');
}
