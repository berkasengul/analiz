# Genç Anadolu Gıda · kurumsal web sitesi

Genç Anadolu Gıda Pazarlama Dağıtım Ltd. Şti. için çok sayfalı kurumsal site (Vite). Sitede satış yapılmaz;
ürün kataloğu, bayilik başvurusu ve iletişim formları vardır.

- **Ürünler:** yalnızca meyve grubu, 14 çeşit (`src/data.js`; dondurma, hindistan cevizi ve ResQ kitlerinin verisi dosyada durur ama sitede gösterilmez).
- **Ana sayfa hareketsizdir:** açılışta sabit görsel (`public/img/hero-d.webp`, `hero-m.webp`); 3B kod yüklenmez.
  Görsel `src/hero/` altındaki 3B sahneden çekilmiştir; sahne değişirse yeniden çekilmelidir.
- **3B** yalnızca ürün kataloğu girişinde ve ürün sayfalarındaki görüntüleyicide kullanılır.

## Sayfalar
| Dosya | İçerik |
|---|---|
| `index.html` | Sade ana sayfa: açılış (yazı + Solagron paketleri yan yana), güven şeridi, doğallık, Solagron meyveleri, kimler satıyor (8 satış kanalı), ürünlerin yararları |
| `kurumsal.html` | Hakkımızda, misyon ve vizyon, üretim tesisi (`#uretim`), kalite ve belgeler (`#kalite`) |
| `urunler.html` | 3B katalog girişi ve tüm ürünler; üç grup filtresi (`?kat=atistirmalik|kit|resq`) ve arama |
| `urun.html?id=<id>` | Ürün sayfası: 3B görüntüleyici, işletmeler için hikâyesi (neden satılır), müşteriye anlatılacak yararları, nerede satılır (4 satış kanalı), ürün bilgileri, besin değerleri, ambalaj ve lojistik, yazdırılabilir PDF ürün föyü |
| `teklif.html` | Toptan teklif formu (ürün seçimi, ambalaj, aylık miktar; Netlify formu `toptan-teklif`). `?urun=<id>` ile o ürün seçili açılır |
| `bayilik.html` | Yumuşak tonlu bayilik sayfası, kısa tanışma formu (`#basvuru`, Netlify formu `bayilik`) |
| `iletisim.html` | İletişim kartları, isteğe bağlı harita, iletişim formu (Netlify formu `iletisim`) |
| `kvkk.html`, `cerez.html` | KVKK aydınlatma metni ve çerez politikası (şablon; hukuk danışmanınca gözden geçirilmeli) |

Ortak üst ve alt bilgi `src/partials/header.html` ve `src/partials/footer.html` içindedir; derleme sırasında
`<!-- @include header -->` yerine eklenir (`vite.config.js`). Kökteki her `.html` dosyası otomatik olarak bir sayfa olur.

## Düzenlenecek bilgiler (`src/data.js` → `SITE`)
- `phone` (görünen numara ve `tel`), `email`
- `address`, `mersis`, `taxOffice`, `taxNo`, `kep` (boş olanlar sitede gösterilmez)
- `whatsapp` (wa.me numarası), `brand` (Solagron)
- Ürün bilgileri, besin değerleri ve işletmeler için ürün hikâyeleri (`PITCH`: neden satılır, hangi satış noktasında; kanallar `CHANNELS`) de `src/data.js` içindedir.
  Yararlar ambalaj bilgileri ve besin değerleri tablosundan üretilir ("yüksek lif" ≥ 6 g/100 g, "düşük yağ" ≤ 3 g/100 g).

## Netlify
- `npm run build` → `dist/`. Formlar Netlify Forms ile çalışır; e-posta bildirimi için Netlify panelinde
  **Forms → Form notifications** açılmalıdır.

## Geliştirme
```
npm install
npm run dev
```

## Ürün grupları (Kasım 2026)
- **Meyve ve dondurma atıştırmalıkları** (Solagron, 16 g): 17 meyve (kavun, karpuz, kivi dahil), sade ve fıstıklı dondurma, hindistan cevizi.
- **Hazır gıda kitleri** (ResQ): Mini Mix, Mini Select, 25 / 35 / 70 servis.
- **ResQ ürünleri**: kahvaltılık gevrek ve kitlerdeki yemekler tek porsiyon (`RESQ_MEALS`, porsiyon ve kcal değerleri kit menülerinden).
- Paketlerin **arka yüzleri** `public/tex/back/<id>.webp` (ambalaj görsellerinden kırpıldı, `f.back`). Arka yüzü olmayan ürünlerde arka yüz sahnede çizilir.
- 3B sahnede dokular gerektikçe yüklenir (gösterilen ürün ve iki yanındakiler); ürün sayfası yalnızca ürünün kendi grubuyla çalışır.

## Ürün videoları
- `public/video/<id>.mp4` + `<id>.webp` (ilk kare); `src/data.js` → `VIDEOS`. Ekleme: `scripts/video-ekle.sh <video> <id> [başlangıç-sn]`.
- Şu anki 12 video Mixkit'ten; her birinin Mixkit sayfasında **Stock Video Free License** (ticari kullanım serbest) doğrulandı:
  cilek 10438 · dilim-cilek 50526 · ahududu 10423 · bogurtlen 10437 · mavi-yemis 52224 · muz 5075 · elma 42946 · ananas 10430 · kivi 5073 · karpuz 10426 · hindistan-cevizi 10432 · dondurma 3547 (mixkit.co/free-stock-video/…-<no>/).
- Videosu olmayan ürünlerde hareketli görsel kullanılır. Higgsfield ile üretmek için tarifler: `docs/higgsfield-video-tarifleri.md`.
