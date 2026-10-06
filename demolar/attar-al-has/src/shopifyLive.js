import C from "./content.json";
import { photoTo3D } from "./photo3d";

// Vitrin Shopify temasında (demo-fabrikasi/araclar/shopify-tema.py: <meta name="vitrin-shopify">) çalışıyorsa
// mağaza sahibinin Shopify panelinde yaptığı değişiklikler her açılışta mağazadan okunur (/products/<handle>.js,
// /products.json) ve sayfa çizilmeden content.json'un üzerine yazılır (main.jsx önce bunu bekler):
// - fiyat, varyant, stok;
// - ürüne yüklenen 3B model (GLB) → products[].glb: vitrinin şişesi yerine o model döner (CanMesh.jsx);
// - ürünün görseli değiştiyse (vitrin kurulurkenki görsel değil) → galeri, kart ve düz zeminli fotoğraftan 3B şişe;
// - vitrinde olmayan yeni ürünler → fotoğrafından 3B şişe (ana sayfa akışına eklenir), olmazsa fotoğraflı kart.
// Hepsi sepete eklenir, Shopify ödemesiyle satılır.
// Şablondaki <base> etiketi dosyaları temanın sunucusundan yükler; mağaza adresleri bu yüzden tam yazılır.
const meta = (n) => (typeof document !== "undefined" ? document.querySelector(`meta[name="${n}"]`) : null);
export const SHOP = meta("vitrin-shopify") ? location.origin : null;

const abs = (u) => (u?.startsWith("//") ? `https:${u}` : u);
// Shopify CDN görseli istenen genişlikte (aynı adres, &width=).
const sized = (u, w) => (u ? `${abs(u)}${u.includes("?") ? "&" : "?"}width=${w}` : u);
const text = (html = "") => {
  const d = document.createElement("div");
  d.innerHTML = html;
  const t = (d.textContent ?? "").replace(/\s+/g, " ").trim();
  return t.length > 220 ? `${t.slice(0, 217).replace(/\s+\S*$/, "")}…` : t;
};
const priceOf = (it, value) => Object.fromEntries(Object.keys(it.price ?? { tr: 0, en: 0 }).map((k) => [k, value]));
const variantsOf = (p) => p.variants.map((x) => ({ id: x.id, title: x.title, available: x.available !== false }));
const srcOf = (img) => abs(typeof img === "string" ? img : img?.src);

// Görselin adı (adres, uzantı, Shopify'ın eklediği _<uuid> eki olmadan): vitrinin kurulduğu andaki görsel mi?
const nameOf = (u) =>
  decodeURIComponent((u ?? "").split("?")[0].split("/").pop() ?? "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "")
    .toLowerCase();
// shopify-tema.py, temayı kurarken mağazadaki ürün görsellerinin adlarını yazar (<script id="vitrin-gorsel">).
const SNAP = (() => {
  try {
    return JSON.parse(document.getElementById("vitrin-gorsel")?.textContent ?? "{}");
  } catch {
    return {};
  }
})();
function ours(it, prod, img) {
  const names = new Set([it.handle, ...(SNAP[it.handle] ?? []), ...[it.image, prod?.file, ...(prod?.photos ?? [])].map(nameOf)].filter((n) => n && !/^\d+$/.test(n)));
  return names.has(nameOf(img));
}

// Fotoğraftan üretilen 3B şişeyi ürüne uygular (photo3d.js).
function use3D(prod, it, r) {
  prod.form = "photo";
  prod.photo3d = r.photo3d;
  prod.labelUrl = r.label;
  prod.file = `shop-${it.handle}.webp`;
  prod.label = { style: "photo" };
  delete prod.views;
  delete prod.heroPhoto;
  delete prod.glass;
  delete prod.garnish;
  it.image = r.cut;
  it.cutout = true;
  delete it.shop;
  delete it.scene;
  delete it.exhibit;
  delete it.wall;
}

async function apply(it, p, jobs) {
  const v = p.variants.find((x) => x.available !== false) ?? p.variants[0];
  if (v) it.price = priceOf(it, Number(v.price));
  it.variants = variantsOf(p);
  it.available = p.variants.some((x) => x.available !== false);
  it.url = `${SHOP}/products/${p.handle}`;
  const prod = it.product != null ? C.products[it.product] : null;
  if (prod?.price) prod.price = { ...it.price };
  const images = (p.images ?? []).map(srcOf).filter(Boolean);
  if (!images.length || ours(it, prod, images[0])) return;
  // Mağaza sahibi ürünün görselini değiştirdi: galeri ve kart onun fotoğraflarıyla; fotoğraf düz zeminliyse
  // 3B şişe de ondan üretilir, değilse vitrinin şişesi kalır, kartta fotoğraf görünür.
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
  delete it.wall;
  if (prod)
    jobs.push(
      photoTo3D(sized(images[0], 1200))
        .then((r) => r && use3D(prod, it, r))
        .catch(() => {})
    );
}

// Vitrinde olmayan ürün: fotoğrafından 3B şişe üretilebilirse vitrinin 3B ürünü olur (ana sayfa akışına ve
// kategorisine eklenir); üretilemezse "Tüm ürünler"de fotoğraflı kart.
async function addNew(p, cats) {
  const v = p.variants.find((x) => x.available !== false) ?? p.variants[0];
  if (!v) return;
  const type = (p.product_type ?? "").toLocaleLowerCase("tr");
  const cat = cats.find((c) => [c.name?.tr, c.name?.en, c.id].some((n) => n && n.toLocaleLowerCase("tr") === type)) ?? cats[0];
  const desc = text(p.body_html);
  const images = (p.images ?? []).map(srcOf).filter(Boolean);
  const size = v.title !== "Default Title" ? v.title : "";
  const it = {
    id: `shop-${p.handle}`,
    handle: p.handle,
    name: { tr: p.title, en: p.title },
    category: cat?.id,
    size,
    price: priceOf(C.catalog.items[0] ?? {}, Number(v.price)),
    exactPrice: true,
    desc: { tr: desc, en: desc },
    color: cat?.color ?? C.theme?.accent ?? "#c9a15c",
    image: images[0] ? sized(images[0], 800) : undefined,
    cutout: false,
    shop: true,
    variants: variantsOf(p),
    available: p.variants.some((x) => x.available !== false),
    url: `${SHOP}/products/${p.handle}`,
  };
  C.catalog.items.push(it);
  const r = images[0] ? await photoTo3D(sized(images[0], 1200)).catch(() => null) : null;
  if (!r) return;
  const tags = (p.tags ?? []).filter((t) => t && t.length < 24).slice(0, 4);
  const base = C.products[0] ?? {};
  const prod = {
    name: p.title,
    sub: size,
    family: p.product_type || cat?.name?.tr || "",
    color: r.color,
    ink: base.ink ?? "#1f1a17",
    theme: { ...(base.theme ?? {}), glow: r.glow, drop: r.drop, accent: r.drop },
    tagline: desc,
    description: desc,
    notes: tags,
    handle: p.handle,
    price: { ...it.price },
    photos: images.map((u) => sized(u, 1600)),
    en: { name: p.title, family: p.product_type || cat?.name?.en || "", tagline: desc, description: desc, notes: tags, sub: size },
  };
  C.products.push(prod);
  it.product = C.products.length - 1;
  use3D(prod, it, r);
  if (Array.isArray(C.home)) C.home.push(it.product);
}

export async function loadShopify() {
  if (!SHOP) return;
  C.commerce = { ...(C.commerce ?? {}), shopify: SHOP };
  delete C.commerce.ikas;
  delete C.commerce.woo;
  const items = C.catalog?.items ?? [];
  // Katalog kaydının Shopify adı: handle; yoksa kimliği (demo fabrikası kimliği çoğunlukla Shopify adıdır).
  for (const it of items) if (!it.handle && it.variants?.length) it.handle = it.id;
  const get = (url) => fetch(url, { credentials: "same-origin", cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
  // Tek istekte bütün ürünler: fiyat, varyant, stok, görseller.
  const list = (await get(`${SHOP}/products.json?limit=250`).catch(() => null))?.products ?? [];
  const byHandle = Object.fromEntries(list.map((p) => [p.handle, p]));
  const jobs = [];
  for (const it of items) if (it.handle && byHandle[it.handle]) apply(it, byHandle[it.handle], jobs);
  // 3B modeller (GLB) yalnızca ürün sayfası verisinde (/products/<handle>.js → media).
  for (const it of items.filter((i) => i.handle && i.product != null))
    jobs.push(
      get(`${SHOP}/products/${it.handle}.js`)
        .then((p) => {
          const glb = p?.media?.find((m) => m.media_type === "model")?.sources?.find((s) => s.format === "glb")?.url;
          if (glb) C.products[it.product].glb = abs(glb);
        })
        .catch(() => {})
    );
  if (C.catalog?.categories?.length) {
    // Yeni ürün: vitrinde de, tema kurulurken mağazada da (SNAP) olmayan; kurulumda vitrine bilerek alınmayan
    // ürünler (numune, set) eklenmez.
    const known = new Set([...items.map((i) => i.handle), ...Object.keys(SNAP)]);
    for (const p of list) if (!known.has(p.handle)) jobs.push(addNew(p, C.catalog.categories).catch(() => {}));
  }
  await Promise.all(jobs);
}

// Mağaza geç cevap verdiyse (sayfa beklemeden çizildi): gelen fiyat ve model, çizilmiş sayfaya uygulanır.
// Uygulamanın türettiği ürün listesi (data.js flavors) güncellenir, fiyat kullanan bileşenler yeniden çizilir.
export async function refreshShop() {
  const [{ flavors }, { useStore }] = await Promise.all([import("./data"), import("./store")]);
  for (const f of flavors) {
    const p = C.products[f.gid];
    if (p?.price) f.price = p.price;
    if (p?.glb) f.glb = p.glb;
  }
  useStore.setState((s) => ({ shopRev: (s.shopRev ?? 0) + 1 }));
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
