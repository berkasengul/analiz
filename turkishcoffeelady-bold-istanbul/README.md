# Turkish Coffee Lady · Bold Istanbul (tek ürün + hikâye)

Önceki 5 tatlı konsept sitenin aynısı, tek ürüne (Bold Istanbul) indirilmiş ve
"Bir Fincan Cesaret" belgeseli üzerine kurulu bir hikâye katmanı eklenmiş hali.

## Sayfalar
Çok sayfalı (adres çubuğunda `#/...`), sade düzen:
- **Ana sayfa** (`/`): 3D Bold Istanbul (kaide + yeni stüdyo fonu), kısa giriş ve üç kapı: Ürün, Hikâye, Film.
- **Ürün** (`#/urun`): ürün hikâyesi, ön/arka kutu geçişi, içindekiler, besin değerleri, kutu bilgisi.
- **Hikâye** (`#/hikaye`): Boston'dan Alexandria'ya 8 perde; "Filmde izle" filmin o anına götürür (`#/film?t=...`).
- **Film** (`#/film`): 36 dk belgesel, 15 bölüm.
- **İletişim** (`#/iletisim`): iletişim bilgileri, form (e-posta ile), SSS.

3D sahne yalnızca ana sayfada çalışır; alt sayfalarda durdurulur. TR/EN dil düğmesi tüm sayfalarda çalışır.

## Klasörler
- `site/`: Netlify'a olduğu gibi yüklenecek klasör.
  `site/film/bir-fincan-cesaret.mp4` repoda yok (80 MB); yayından önce bu yola koyun.
- `kaynak/`: orijinal bundle (okunabilir hali), yamalar (`patch.py`) ve yeni bölümler (`extra.js`).
  Stil: `site/film/film.css`.
- `transkript/`: belgeselin zaman damgalı transkripti (alıntılar ve bölüm saatleri buradan).

## 3D kutu (gerçek ambalaj)
3D kutu, `site/assets/bold-istanbul-real-*.webp` dokusundan üretilir (2560×1280; sol yarı ön, sağ yarı arka).
- Ön yüz: markanın resmi Bold Istanbul render'ı, birebir.
- Arka yüz: gerçek kutudan yeniden çizildi: hanım logosu + "Art Work: hasankale" (fotoğraftan, ışık düzeltmeli),
  besin tablosu, "Established 2017" bloğu, içindekiler, "Discover Your Daily Coffee Wisdom", QR ve barkod.
  Panel içeriği silindire göre bükülüp ön render'ın ışığıyla gölgelendirildi.
- Gövde silüeti (`kaynak/geom.json`) gerçek kutunun kenarından hesaplandı.
- QR ve barkod fotoğraftan okunamadı; görsel olarak çizildi, taranınca çalışmaz.
  Gerçek QR bağlantısı ve barkod numarası gelirse `kaynak/kutu/` içinden yeniden üretilir.
- Yeniden üretim: `kaynak/kutu/strip.html` → `strip.png` (arka etiket), sonra `python3 compose.py`.
