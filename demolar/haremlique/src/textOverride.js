import C from "./content.json";

// Shopify teması (demo-fabrikasi/araclar/shopify-tema.py): mağaza sahibi yazıları Shopify'da
// "Temalar → Özelleştir → Tema ayarları"ndan değiştirir. Tema bunları <script id="vitrin-metin"> içine
// [[yol, yazı], …] olarak koyar; burada, sayfa ilk çizilmeden content.json'un üzerine yazılır.
// Arayüz yazıları (ui) content.json'da yoksa motorun varsayılanının (i18n.js) yerine eklenir.
// main.jsx'te ilk içe aktarılan modül olmalı: diğer modüller içerikten türettiklerini yüklenirken hesaplar.
const el = typeof document !== "undefined" && document.getElementById("vitrin-metin");
if (el) {
  try {
    for (const [paths, value] of JSON.parse(el.textContent)) {
      if (typeof value !== "string" || !value.trim()) continue;
      for (const path of paths) {
        const add = path[0] === "ui";
        let o = C;
        for (const k of path.slice(0, -1)) {
          if (add && o && o[k] == null) o[k] = {};
          o = o?.[k];
        }
        const last = path.at(-1);
        if (o && (typeof o[last] === "string" || (add && o[last] === undefined))) o[last] = value;
      }
    }
  } catch {
    // Bozuk veri: vitrin kendi yazılarıyla açılır.
  }
}
