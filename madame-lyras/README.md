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
| `index.html` | Ana sayfa: 3B açılış, güven şeridi, ürün grupları, kurumsal tanıtım, öne çıkan ürünler, neden biz, üretim, belgeler |
| `kurumsal.html` | Hakkımızda, misyon ve vizyon, üretim tesisi (`#uretim`), kalite ve belgeler (`#kalite`) |
| `urunler.html` | Filtreli ürün kataloğu (`?kat=meyve|tatli|atistirmalik|kit`) ve arama |
| `urun.html?id=<id>` | Ürün sayfası: 3B görüntüleyici, ürün bilgileri, besin değerleri, kit içeriği, ambalaj ve lojistik, yazdırılabilir PDF ürün föyü |
| `bayilik.html` | Avantajlar, kimler başvurabilir, süreç, sık sorulan sorular, başvuru formu (`#basvuru`, Netlify formu `bayilik`) |
| `iletisim.html` | İletişim kartları, isteğe bağlı harita, iletişim formu (Netlify formu `iletisim`) |
| `kvkk.html`, `cerez.html` | KVKK aydınlatma metni ve çerez politikası (şablon; hukuk danışmanınca gözden geçirilmeli) |

Ortak üst ve alt bilgi `src/partials/header.html` ve `src/partials/footer.html` içindedir; derleme sırasında
`<!-- @include header -->` yerine eklenir (`vite.config.js`). Kökteki her `.html` dosyası otomatik olarak bir sayfa olur.

## Düzenlenecek bilgiler (`src/data.js` → `SITE`)
- `phone` (görünen numara ve `tel`), `email`
- `address`, `mersis`, `taxOffice`, `taxNo`, `kep` (boş olanlar sitede gösterilmez)
- Ürün bilgileri, besin değerleri ve kit menüleri de `src/data.js` içindedir.

## Netlify
- `npm run build` → `dist/`. Formlar Netlify Forms ile çalışır; e-posta bildirimi için Netlify panelinde
  **Forms → Form notifications** açılmalıdır.

## Geliştirme
```
npm install
npm run dev
```
