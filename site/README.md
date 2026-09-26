# Football Pulse — 3D landing page

Scroll'a bağlı 3D futbol topu (Three.js) + GSAP ScrollTrigger animasyonları.
Build adımı yok: `index.html`, `style.css`, `main.js` statik dosyalardır.

## Lokal çalıştırma
ES module kullandığı için dosyayı çift tıklayarak değil, bir sunucuyla açın:

```bash
cd site && python3 -m http.server 8080
# http://localhost:8080
```

## Yayınlama (Netlify)
Netlify'da "Publish directory" olarak `site` klasörünü seçin (build komutu boş).

## Özelleştirme
- YouTube linkleri: `index.html` içindeki `https://www.youtube.com/` adreslerini kanal URL'si ile değiştirin.
- Top renkleri: `main.js` → `uniforms` (`uHex`, `uPent`, `uGlow`).
- Scroll koreografisi: `main.js` → `keyframes` (her bölüm için x/y/ölçek/enerji).
