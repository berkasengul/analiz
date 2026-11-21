// Ürün sahnesinin ilk görüntüsü: sayfa JavaScript'i yüklenmeden, tarayıcının ilk çiziminde paket ve zemin görünsün.
// urun.html ve urunler.html içindeki <!-- early --> … <!-- /early --> arasını data.js'ten yeniden üretir.
// Kullanım: node scripts/early.mjs  (ürün, görsel veya renk değişince çalıştırın)
import { readFileSync, writeFileSync } from 'node:fs';
import { FLAVORS } from '../src/data.js';

const map = {};
for (const f of FLAVORS) map[f.id] = [f.model ? `/img/kit/${f.kit}-cut.webp` : f.md, f.bg, f.group];
const first = {};
for (const f of FLAVORS) if (!first[f.group]) first[f.group] = f.id;
first.tum = FLAVORS[0].id;

const code = (page) => `<!-- early --><script>(function(){var M=${JSON.stringify(map)},F=${JSON.stringify(first)},q=new URLSearchParams(location.search),id=${page === 'urun' ? "q.get('id')" : "F[q.get('kat')]||F.tum"};var e=M[id]||M[F.tum],s=document.getElementById('pstage'),i=document.getElementById('pimg');if(!e||!s||!i)return;i.src=e[0];s.style.setProperty('--c',e[1]);s.style.setProperty('--zemin','url(/img/zemin/'+(M[id]?id:F.tum)+'.webp)');if(innerWidth>=760&&innerWidth/innerHeight>=0.9){var st=s.getBoundingClientRect(),pl=s.querySelector('.pstage__panel'),th=document.getElementById('pThumbs');if(pl&&th){var a=pl.getBoundingClientRect(),b=th.getBoundingClientRect();if(a.width&&b.width){var f=((a.right+b.left)/2-st.left)/st.width;s.style.setProperty('--cx',(Math.min(.7,Math.max(.5,f))*100).toFixed(2)+'%');}}}})();</script><!-- /early -->`;

for (const [file, page] of [['urun.html', 'urun'], ['urunler.html', 'urunler']]) {
  let s = readFileSync(file, 'utf8');
  const block = code(page);
  if (s.includes('<!-- early -->')) s = s.replace(/<!-- early -->[\s\S]*?<!-- \/early -->/, block);
  else {
    const a = s.indexOf('<section class="pstage');
    const b = s.indexOf('\n    </section>', a) + '\n    </section>'.length;
    s = s.slice(0, b) + `\n    ${block}` + s.slice(b);
  }
  writeFileSync(file, s);
  console.log(file, 'ok');
}
