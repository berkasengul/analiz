# Turkish Coffee Lady · Bold Istanbul (tek ürün + hikâye)

Önceki 5 tatlı konsept sitenin aynısı, tek ürüne (Bold Istanbul) indirilmiş ve
"Bir Fincan Cesaret" belgeseli üzerine kurulu bir hikâye katmanı eklenmiş hali.

## Sayfa akışı
1. Hero: 3D Bold Istanbul (tek ürün; carousel, tat bulucu ve 5'li katalog kaldırıldı)
2. Lansman (3 adım, hepsi Bold Istanbul)
3. **Film** (`#film`): 36 dk belgesel, özel oynatıcı + 15 tıklanabilir bölüm
4. **Hikâye** (`#journey`): Boston'dan Alexandria'ya 8 perde; her perdede filmden kare,
   transkriptten birebir alıntı ve "Filmde izle" ile o ana atlama
5. **Ürünün hikâyesi** (`#bold-istanbul`): Bold Istanbul kutusu ve hikâyeyle bağı
6. Marka hikâyesi, nerede, SSS, iletişim (mevcut bölümler, metinler tek ürüne göre güncellendi)

TR/EN dil düğmesi yeni bölümlerde de çalışır.

## Klasörler
- `site/`: Netlify'a olduğu gibi yüklenecek klasör.
  `site/film/bir-fincan-cesaret.mp4` repoda yok (80 MB); yayından önce bu yola koyun.
- `kaynak/`: orijinal bundle (okunabilir hali), yamalar (`patch.py`) ve yeni bölümler (`extra.js`).
  Stil: `site/film/film.css`.
- `transkript/`: belgeselin zaman damgalı transkripti (alıntılar ve bölüm saatleri buradan).
