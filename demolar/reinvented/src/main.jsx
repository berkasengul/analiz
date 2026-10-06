// Shopify'da değiştirilen yazılar, içerik okunmadan önce uygulanır.
import "./textOverride";
import C from "./content.json";
import { keepHashLinks, loadShopify, refreshShop } from "./shopifyLive";

import "./css/base.css";

// Büyük harf dönüşümleri Türkçe kurallara uysun (i → İ).
document.documentElement.lang = C.htmlLang ?? "tr";
// Kategoriler arası geçişte sayfa yeniden açılır; eski kaydırma konumu taşınmasın.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
keepHashLinks();

// Shopify mağazasında: önce güncel fiyat, stok, model, fotoğraf ve yeni ürünler mağazadan okunur (en çok 6 sn
// beklenir; daha geç gelirse çizilmiş sayfaya uygulanır: refreshShop), sonra uygulama yüklenir. Uygulamanın modülleri içerikten türettiklerini (ürün seti, renkler)
// yüklenirken hesapladığı için hepsi bundan sonra içe aktarılır.
async function start() {
  const [{ default: React }, { default: ReactDOM }, { applyTheme }] = await Promise.all([
    import("react"),
    import("react-dom/client"),
    import("./theme"),
  ]);
  applyTheme();
  const root = ReactDOM.createRoot(document.getElementById("root"));
  // ?still=<n>: kart görseli çekimi için yalnızca tek ürün, saydam zeminde (demo-fabrikasi/araclar/kart-3b.py).
  if (new URLSearchParams(location.search).has("still")) {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    const { default: Still } = await import("./Still.jsx");
    root.render(<Still />);
    return;
  }
  const { default: App } = await import("./App.jsx");
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

const live = loadShopify();
let liveDone = false;
live.finally(() => (liveDone = true));
Promise.race([live, new Promise((r) => setTimeout(r, 6000))]).finally(async () => {
  const late = !liveDone;
  await start();
  if (late) live.then(refreshShop, () => {});
});
