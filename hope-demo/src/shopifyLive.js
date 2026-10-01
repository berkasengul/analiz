import { content, flavors } from "./data";

// Vitrin bir Shopify mağazasının kendi sayfasında çalışıyorsa (tema şablonu: <meta name="vitrin-shopify">;
// demo-fabrikasi/araclar/shopify-sayfa.py) fiyat, varyant ve stok her açılışta mağazadan okunur
// (/products/<handle>.js): mağaza sahibi fiyatı Shopify panelinden değiştirir, vitrin de değişir.
// Şablondaki <base> etiketi dosyaları vitrinin sunucusundan yükler; mağaza adresleri bu yüzden tam yazılır.
export const SHOP = typeof document !== "undefined" && document.querySelector('meta[name="vitrin-shopify"]') ? location.origin : null;

export async function loadShopify() {
  if (!SHOP) return;
  content.commerce = { ...(content.commerce ?? {}), shopify: SHOP };
  delete content.commerce.ikas;
  delete content.commerce.woo;
  const items = (content.catalog?.items ?? []).filter((i) => i.handle);
  await Promise.all(
    items.map(async (it) => {
      try {
        const r = await fetch(`${SHOP}/products/${it.handle}.js`, { credentials: "same-origin" });
        if (!r.ok) return;
        const p = await r.json();
        const v = p.variants.find((x) => x.available) ?? p.variants[0];
        const price = v.price / 100;
        it.price = Object.fromEntries(Object.keys(it.price ?? { tr: 0, en: 0 }).map((k) => [k, price]));
        it.variants = p.variants.map((x) => ({ id: x.id, title: x.title, available: x.available }));
        it.available = p.available;
        it.url = `${SHOP}/products/${it.handle}`;
        if (it.product != null) {
          const prod = content.products[it.product];
          if (prod?.price) prod.price = { ...it.price };
          const f = flavors.find((x) => x.gid === it.product);
          if (f?.price) f.price = { ...it.price };
        }
      } catch {
        // Mağazaya ulaşılamazsa vitrindeki fiyat kalır.
      }
    })
  );
}

// Sayfa bağlantıları (#/urunler…) <base> yüzünden vitrinin sunucusuna gitmesin: adres mağazada kalır.
export function keepHashLinks() {
  if (!SHOP) return;
  document.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.('a[href^="#/"]');
      if (!a) return;
      e.preventDefault();
      location.hash = a.getAttribute("href").slice(1);
    },
    true
  );
}
