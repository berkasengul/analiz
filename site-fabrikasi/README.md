# Site fabrikası: fotoğraftan 3B marka sitesi

3–4 ürün fotoğrafı yükle → Turkish Coffee Lady / UnBe kalitesinde 3B marka sitesi.

## Kullanım (Claude Code ile)

1. Ürün fotoğraflarını `site-fabrikasi/yukle/<marka>/` klasörüne koy (önden, sade zemin, gün ışığı).
2. Claude'a yaz: **"<marka> için fotoğraftan site yap"** (+ varsa WhatsApp numarası, Instagram, markanın sitesi).
3. Claude fotoğraflara bakıp `marka.json` dosyasını yazar ve hattı çalıştırır.
4. Çıktı: `demolar/<marka>-Netlify.zip` (Netlify Drop'a sürükle → link) ve önizleme görüntüleri `site-fabrikasi/cikti/<marka>/`.

Elle çalıştırmak için: `python3 site-fabrikasi/fotodan-site.py <marka>`

## İçinde ne var

- `fotodan-site.py`: `marka.json` + fotoğraflar → demo fabrikası girdileri → arka plan silme ve silüetten 3B
  (`demo-fabrikasi/araclar/shopify-foto.py`) → ürün aktarımı (`shopify-aktar.py`) → derleme ve zip (`yeni-demo.py`) → önizleme.
- Şablon: UnBe ayarı (sayfalı 3B akış, kaide, ürün rengine göre sahne ışığı, notalar, keşif/katalog sayfaları, TR/EN).
- Sipariş: her ürün butonu WhatsApp'a hazır mesajla gider.
- Örnek: `yukle/mavikoy/` (hayali kolonya markası, yapay zekâ ile üretilmiş ürün fotoğrafları).

## Gerekenler (bir kez)

`cd hope-demo && npm install` · `pip install rembg onnxruntime` · Playwright (önizleme için).
