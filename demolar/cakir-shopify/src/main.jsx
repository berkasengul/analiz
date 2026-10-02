// Shopify'da değiştirilen yazılar, içerik okunmadan önce uygulanır.
import "./textOverride";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./css/base.css";
import { applyTheme } from "./theme";
import { content } from "./data";
import { keepHashLinks, loadShopify } from "./shopifyLive";

// Büyük harf dönüşümleri Türkçe kurallara uysun (i → İ).
document.documentElement.lang = content.htmlLang ?? "tr";
// Kategoriler arası geçişte sayfa yeniden açılır; eski kaydırma konumu taşınmasın.
applyTheme();
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

// ?still=<n>: kart görseli çekimi için yalnızca tek ürün, saydam zeminde (demo-fabrikasi/araclar/kart-3b.py).
if (new URLSearchParams(location.search).has("still")) {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  import("./Still.jsx").then(({ default: Still }) => ReactDOM.createRoot(document.getElementById("root")).render(<Still />));
} else {
  // Shopify mağazasının sayfasında: önce güncel fiyat ve stok mağazadan okunur (en çok 3 sn beklenir).
  const render = () =>
    ReactDOM.createRoot(document.getElementById("root")).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  keepHashLinks();
  Promise.race([loadShopify(), new Promise((r) => setTimeout(r, 3000))]).finally(render);
}
