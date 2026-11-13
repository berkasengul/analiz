# Müşteri bulma ekibi (her gün, hafta içi)

Görev: günde `ayar.json → gunluk_yeni_firma` kadar (5) **yeni** firma bul, her birine 3B demo site üret ve mail taslağını
hazırla. Kullanıcıya soru sorma; karar verilemeyen firmayı `elendi` yap ve sıradakine geç.

## Kime yazılır

- Kendi online mağazası olan (Shopify, ikas, WooCommerce) Türk **firması** (şirket, tacir/esnaf): parfüm, kolonya,
  mum, oda kokusu, sabun, cilt bakımı, kahve, çay, zeytinyağı, bal (`ayar.json → sektorler`).
- Küçük/orta ölçek, kendi ürünü olan marka. Büyük zincirler, pazaryeri satıcıları, distribütörler, başka
  markanın ürününü satanlar: hayır.
- **Ürün fotoğrafları uygun olmalı:** en az 3–4 ürünün beyaz/sade fonda, **düz önden** çekimi (şişe, kavanoz, tüp,
  kutu). Üstten açılı, elde, sahne içinde çekimler 3B'de bozuk çıkar: o ürünleri seçme; uygun ürün yoksa firmayı ele.
- Sitesinde açık bir şirket e-postası olmalı (`kontrol` mesafeli satış / KVKK sayfalarını da tarar). Kişisel
  gmail/hotmail adreslerine yazma (KVKK): yalnızca markanın alan adındaki ya da sitede şirket iletişimi diye yazan adres.
- `bilinen.txt`, `cikanlar.txt` ve `firmalar.json`'daki markalar atlanır (`ekle` bunu kendisi denetler).

## Nasıl bulunur

WebSearch ile ("doğal sabun markası", "el yapımı kolonya", "butik kahve kavurucu", "aromaterapi mum", Instagram'da
öne çıkan yeni markalar, Beymen/Dermoeczanem gibi perakendecilerde satılan küçük markalar…), sonra markanın
alan adını bulup platformu dene:

```bash
curl -s https://<alan>/products.json?limit=1 | head -c 80             # Shopify
curl -s -o /dev/null -w '%{http_code}' https://<alan>/wp-json/wc/store/v1/products   # Woo (200)
curl -sL https://<alan>/ | grep -o -m1 ikas                            # ikas
```

## Her firma için adımlar

```bash
cd satis-hatti
python3 hat.py ekle <slug> --ad "Marka" --site alan.com --sektor "..." --sehir "..." --kaynak <bulduğun sayfa> --neden "kısa neden"
python3 hat.py kontrol <slug>            # platform + e-posta; uygun değilse kendisi 'elendi' yapar
python3 hat.py urunler <slug>            # ürün listesi
python3 hat.py cek <slug> h1 h2 h3 h4    # 3–4 ürün: aynı seriden, renkleri farklı, önden çekimli
```

1. **Fotoğraflara bak** (`site-fabrikasi/yukle/<slug>/`, birkaçını yan yana küçültüp Read ile). İlk fotoğraf düz
   önden değilse `-2`, `-3` dosyalarından düzgün olanı seç. Hiçbiri uygun değilse başka ürünler çek ya da ele:
   `python3 hat.py durum <slug> elendi "fotoğraflar 3B için uygun değil"`.
2. **marka.json yaz:** `taslak.json` (ürün adları, açıklamalar, adresler) + sitenin hakkımızda/mesafeli satış sayfası.
   Biçim için örnek: `site-fabrikasi/yukle/halare/marka.json`. Kurallar:
   - Gerçek marka: `"fictional": false`, `"whatsapp": ""`, her üründe `url` (mağazadaki sayfası), `email`, `website`.
   - **Uydurma yok:** nota, içerik, şehir, hikâye yalnızca markanın sitesinden. Fiyat yok (`price: 0`).
   - `perks` 3 madde, `features` tam 4 kart, `faqs` 2–3 soru; hepsi markanın kendi bilgisinden, TR + EN.
   - `words.action`: spreyli üründe "Spreyi sık", mumda boş + `"spray": false`.
3. `python3 hat.py uret <slug>` → `site-fabrikasi/cikti/<slug>/onizleme_0.jpg` ve `_1.jpg`'ye **mutlaka bak**.
   Şişe bozuk, etiket okunmuyor ya da sayfa boşsa düzelt (fotoğraf, `depthRatio`, `foto` kuralları) ve tekrar üret.
   İki denemede düzelmezse ele. Kötü bir demo gönderilmez.
4. **Mail taslağı:** `site-fabrikasi/yukle/<slug>/mail.md`, örnek `yukle/halare/mail.md`. İlk satır `Konu: ...`;
   en çok 170 kelime; demo linki yerine `{demo}`; markanın kendi ürün adlarıyla somut 3 madde; fiyat yok, abartı yok;
   imza ve çıkış notunu yazma (otomatik eklenir). `python3 hat.py mail <slug> site-fabrikasi/yukle/<slug>/mail.md`
5. `python3 hat.py yayinla <slug>` (Netlify anahtarı yoksa bu adım hata verir; firma `site_hazir` kalır, sorun değil).

## Bitiş

```bash
python3 satis-hatti/hat.py panel
git add satis-hatti site-fabrikasi/yukle demo-fabrikasi/araclar && git commit -m "Bulma ekibi: <tarih> yeni firmalar" && git push
```

Sonra paneli güncelle (`satis-hatti/PANEL.md`). Bir sorun çıkarsa (ör. araç hatası) düzeltmeyi dene; düzelmezse
`firmalar.json`'a not düş ve özetinde yaz.
