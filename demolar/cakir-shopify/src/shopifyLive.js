import C from "./content.json";

// Vitrin Shopify temasında (demo-fabrikasi/araclar/shopify-tema.py: <meta name="vitrin-shopify">) çalışıyorsa
// mağaza sahibinin Shopify panelinde yaptığı değişiklikler her açılışta mağazadan okunur (/products/<handle>.js,
// /products.json) ve sayfa çizilmeden content.json'un üzerine yazılır (main.jsx önce bunu bekler):
// - fiyat, varyant, stok;
// - ürüne yüklenen 3B model (GLB) → products[].glb: vitrinin şişesi yerine o model döner (CanMesh.jsx);
// - tema kurulduktan sonra yüklenen ürün fotoğrafları (Shopify adresindeki ?v= yükleme zamanı >
//   <meta name="vitrin-built">) → ürünün galerisi ve kart görseli;
// - vitrinde olmayan yeni ürünler → "Tüm ürünler"de fotoğraflı kart (sepete eklenir, Shopify ödemesiyle satılır).
// Şablondaki <base> etiketi dosyaları temanın sunucusundan yükler; mağaza adresleri bu yüzden tam yazılır.
const meta = (n) => (typeof document !== "undefined" ? document.querySelector(`meta[name="${n}"]`) : null);
export const SHOP = meta("vitrin-shopify") ? location.origin : null;
const BUILT = Number(meta("vitrin-built")?.content) || Infinity;

const abs = (u) => (u?.startsWith("//") ? `https:${u}` : u);
// Shopify CDN görseli istenen genişlikte (aynı adres, &width=).
const sized = (u, w) => (u ? `${abs(u)}${u.includes("?") ? "&" : "?"}width=${w}` : u);
const uploaded = (u) => Number(/[?&]v=(\d+)/.exec(u ?? "")?.[1] ?? 0);
const text = (html = "") => {
  const d = document.createElement("div");
  d.innerHTML = html;
  const t = (d.textContent ?? "").replace(/\s+/g, " ").trim();
  return t.length > 220 ? `${t.slice(0, 217).replace(/\s+\S*$/, "")}…` : t;
};
const priceOf = (it, value) => Object.fromEntries(Object.keys(it.price ?? { tr: 0, en: 0 }).map((k) => [k, value]));

function apply(it, p) {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
  it.price = priceOf(it, v.price / 100);
  it.variants = p.variants.map((x) => ({ id: x.id, title: x.title, available: x.available }));
  it.available = p.available;
  it.url = `${SHOP}/products/${p.handle}`;
  const prod = it.product != null ? C.products[it.product] : null;
  if (prod?.price) prod.price = { ...it.price };
  const glb = p.media?.find((m) => m.media_type === "model")?.sources?.find((s) => s.format === "glb")?.url;
  if (prod && glb) prod.glb = abs(glb);
  const images = p.images ?? [];
  if (images.some((u) => uploaded(u) > BUILT)) {
    if (prod) {
      prod.photos = images.map((u) => sized(u, 1600));
      delete prod.views;
      delete prod.heroPhoto;
    }
    it.image = sized(images[0], 800);
    it.cutout = false;
    it.shop = true;
    delete it.scene;
    delete it.exhibit;
  }
}

function addNew(p, cats) {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
  if (!v) return;
  const type = (p.product_type ?? "").toLocaleLowerCase("tr");
  const cat = cats.find((c) => [c.name?.tr, c.name?.en, c.id].some((n) => n && n.toLocaleLowerCase("tr") === type)) ?? cats[0];
  const desc = text(p.body_html);
  C.catalog.items.push({
    id: `shop-${p.handle}`,
    handle: p.handle,
    name: { tr: p.title, en: p.title },
    category: cat?.id,
    size: v.title !== "Default Title" ? v.title : "",
    price: priceOf(C.catalog.items[0] ?? {}, Number(v.price)),
    exactPrice: true,
    desc: { tr: desc, en: desc },
    color: cat?.color ?? C.theme?.accent ?? "#c9a15c",
    image: p.images?.[0]?.src ? sized(p.images[0].src, 800) : undefined,
    cutout: false,
    shop: true,
    variants: p.variants.map((x) => ({ id: x.id, title: x.title, available: x.available })),
    available: p.variants.some((x) => x.available),
    url: `${SHOP}/products/${p.handle}`,
  });
}

export async function loadShopify() {
  if (!SHOP) return;
  C.commerce = { ...(C.commerce ?? {}), shopify: SHOP };
  delete C.commerce.ikas;
  delete C.commerce.woo;
  const items = C.catalog?.items ?? [];
  const get = (url) => fetch(url, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null));
  await Promise.all([
    ...items
      .filter((i) => i.handle)
      .map((it) =>
        get(`${SHOP}/products/${it.handle}.js`)
          .then((p) => p && apply(it, p))
          .catch(() => {})
      ),
    // Yeni ürünler (katalogu olan vitrinlerde).
    C.catalog?.categories?.length
      ? get(`${SHOP}/products.json?limit=250`)
          .then((r) => {
            const known = new Set(items.map((i) => i.handle));
            for (const p of r?.products ?? []) if (!known.has(p.handle)) addNew(p, C.catalog.categories);
          })
          .catch(() => {})
      : null,
  ]);
}

// Sayfa bağlantıları (#/urunler…) <base> yüzünden temanın sunucusuna gitmesin: adres mağazada kalır.
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
