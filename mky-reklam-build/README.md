# MKY Reklam & Medya — site kaynak dosyaları

Yayınlanan site `../mky-reklam-site/` klasöründedir (Netlify bu klasörü yayınlar).
Bu klasör, o sayfaları üreten kaynaklardır.

## İçerik nasıl değiştirilir?
1. `data.py` dosyasını açın:
   - **SITE**: telefon, WhatsApp numarası, e-posta, adres, çalışma saatleri
   - **SERVICES**: hizmetler, alt hizmetler, SSS
   - **PROJECTS**: portfolyo projeleri
2. Sayfaları yeniden üretin:
   ```bash
   python3 build.py
   ```

## Gerçek bir proje eklemek
1. Görselleri `../mky-reklam-site/assets/img/work/` klasörüne koyun (ör. `firma-tabela-1.jpg`, 1600 px genişlik önerilir).
2. `data.py` → `PROJECTS` listesine yeni bir kayıt ekleyin, `"konsept": False` yapın.
   Ana sayfada görünmesini istiyorsanız `"featured": True` ekleyin.
3. `python3 build.py`

## Klasörler
- `templates/` — sayfa şablonları (Jinja2)
- `mockups/` — konsept proje görsellerini üreten sahneler
  - `sites/` örnek web siteleri, `scenes/` tabela/araç/billboard/kimlik sahneleri
  - `photos/` Lorem Picsum (Unsplash lisanslı) fotoğraflar
  - Yeniden üretmek için: `node shoot_sites.js && node render.js` (Playwright gerekir)
