import { useEffect, useMemo, useState } from "react";

import { content, flavors } from "../data";
import { useT, termLang } from "../i18n";
import { scrollToElement } from "../scroll";
import { useStore } from "../store";
import { THEME } from "../theme";

// Koku bulucu: üç soru, cevaplar her kokunun kendi notalarına (markanın sitesinden) göre puanlanır.
// Sonuçta o koku kendi renginde bir sahnede kaideye iner, iki yanında notaları (garnish) süzülür;
// "Keşfet" 3B vitrinde açar (vitrinde yoksa ürün sayfasına gider), sepete eklenebilir, iki alternatif önerilir.
// content.finder === false kapatır ({categories: [...]} öneriyi o kategorilerle sınırlar); notası olan en az 3 ürün gerekir.
const C = content.catalog;
const BASE = import.meta.env.BASE_URL;

// Nota → koku ailesi (Türkçe, İngilizce ve Macarca nota adları; parça eşleşmesi). Ürünün koku ailesi
// (ör. Macarca "virágos", "fás") da sayılır.
export const FAM = {
  fresh: ["aldehit", "aldehyde", "anason", "anise", "citrom", "bergamott", "narancs", "gyömbér", "tenger", "menta", "zöld", "levendula", "körte", "alma", "kardamom", "boróka", "friss", "citrus", "lemon", "limon", "bergamot", "mandarin", "mandalina", "grapefruit", "greyfurt", "lime", "misket", "orange", "portakal", "citrus", "narenciye", "ginger", "zencefil", "aquatic", "akuatik", "sea", "deniz", "marine", "ice", "buz", "mint", "nane", "green", "yeşil", "lavender", "lavanta", "ozone", "ozon", "pear", "armut", "apple", "elma", "cardamom", "kakule", "violet leaf", "aloe", "juniper", "ardıç", "neroli", "yuzu"],
  floral: ["süsen", "hanımeli", "honeysuckle", "carnation", "írisz", "rózsa", "jázmin", "orgona", "frézia", "bazsarózsa", "orchidea", "virág", "liliom", "gardénia", "ibolya", "heliotróp", "magnólia", "hárs", "kamilla", "nárcisz", "jácint", "osmanthus", "púderes", "iris", "rose", "gül", "jasmin", "yasemin", "lilac", "leylak", "freesia", "frezya", "peony", "şakayık", "orchid", "orkide", "blossom", "çiçe", "flower", "lily", "zambak", "tuberose", "sümbülteber", "gardenia", "gardenya", "violet", "menekşe", "heliotrop", "magnolia", "papyrus", "ıhlamur", "linden", "petal", "papatya", "chamomile", "nergis", "narcissus", "sümbül"],
  sweet: ["vanília", "karamell", "csokoládé", "kakaó", "praliné", "méz", "cseresznye", "meggy", "cukor", "mangó", "maracuja", "ananász", "barack", "bogyó", "eper", "kókusz", "ribizli", "málna", "gyümölcs", "licsi", "mandula", "pisztácia", "gourmand", "édes", "vanilla", "vanilya", "caramel", "karamel", "chocolate", "çikolata", "cookie", "kurabiye", "cacao", "kakao", "praline", "pralin", "tonka", "honey", "bal", "rum", "cherry", "kiraz", "sugar", "şeker", "mango", "passion", "çarkıfelek", "pineapple", "ananas", "nectarine", "peach", "şeftali", "berry", "çilek", "strawberry", "coconut", "hindistan", "gelato", "candy", "cassis", "frenk üzümü", "raspberry", "ahududu", "fruit", "meyve", "liçi", "lychee"],
  warm: ["günnük", "frankincense", "tefarik", "laden", "kurum", "soot", "duman", "smoke", "bőr", "dohány", "ámbra", "pacsuli", "szantál", "cédrus", "sáfrány", "fahéj", "bors", "szerecsendió", "tömjén", "fás", "fa,", "pézsma", "moha", "kasmír", "szegfűszeg", "fenyő", "gyanta", "tölgy", "fűszer", "keleti", "orientális", "oud", "leather", "deri", "tobacco", "tütün", "amber", "patchouli", "paçuli", "sandal", "cedar", "sedir", "vetiver", "saffron", "safran", "cinnamon", "tarçın", "pepper", "biber", "nutmeg", "muskat", "incense", "tütsü", "wood", "odun", "musk", "misk", "moss", "yosun", "agarwood", "cypriol", "cashmere", "kaşmir", "cognac", "konyak", "labdanum", "kehribar", "ambergris", "clove", "karanfil", "köknar", "reçine", "resin", "meşe"],
};
// Markaya özel eşleşmeler (content.finder.keys: {fresh: [...], ...}): kahve, çay gibi parfüm dışı ürünlerde
// tat sözcükleri ("koyu", "sütlü", "sakız") ailelere bağlanır; parfüm sözcüklerine eklenir.
for (const [f, keys] of Object.entries(content.finder?.keys ?? {})) FAM[f] = [...(FAM[f] ?? []), ...keys];
const Q = {
  en: [
    ["Which world pulls you in?", [["Citrus and a sea breeze", { fresh: 1 }], ["A bouquet of flowers", { floral: 1 }], ["Something sweet", { sweet: 1 }], ["Wood, spice and smoke", { warm: 1 }]]],
    ["When will you wear it?", [["Sunny days", { fresh: 0.6, floral: 0.4 }], ["City evenings", { sweet: 0.5, warm: 0.5 }], ["A night to remember", { warm: 0.7, sweet: 0.3 }], ["Every day", { floral: 0.5, fresh: 0.5 }]]],
    ["How should it make you feel?", [["Light and free", { fresh: 0.6, floral: 0.4 }], ["Soft and cosy", { sweet: 0.6, floral: 0.4 }], ["Bold and magnetic", { warm: 0.7, sweet: 0.3 }], ["Quietly elegant", { floral: 0.6, warm: 0.4 }]]],
  ],
  tr: [
    ["Hangi dünya seni çekiyor?", [["Narenciye ve deniz esintisi", { fresh: 1 }], ["Bir buket çiçek", { floral: 1 }], ["Tatlı bir şey", { sweet: 1 }], ["Odun, baharat ve duman", { warm: 1 }]]],
    ["Ne zaman süreceksin?", [["Güneşli günler", { fresh: 0.6, floral: 0.4 }], ["Şehirde akşamlar", { sweet: 0.5, warm: 0.5 }], ["Unutulmaz bir gece", { warm: 0.7, sweet: 0.3 }], ["Her gün", { floral: 0.5, fresh: 0.5 }]]],
    ["Sana nasıl hissettirsin?", [["Hafif ve özgür", { fresh: 0.6, floral: 0.4 }], ["Yumuşak ve sıcacık", { sweet: 0.6, floral: 0.4 }], ["Cesur ve çekici", { warm: 0.7, sweet: 0.3 }], ["Sessizce zarif", { floral: 0.6, warm: 0.4 }]]],
  ],
};
const TXT = {
  en: { eyebrow: "Scent finder", title: "Find your story", lead: "Three questions. We read every scent’s notes and put yours on the plinth.", empty: "Your scent will land here", result: "Your scent", discover: "Discover the scent", add: "Add to bag", added: "Added", again: "Start over", also: "Also try", back: "Back" },
  tr: { eyebrow: "Koku bulucu", title: "Kokunu bul", lead: "Üç soru. Her kokunun notalarını okuyup seninkini kaideye koyuyoruz.", empty: "Kokun buraya inecek", result: "Senin kokun", discover: "Kokuyu keşfet", add: "Sepete ekle", added: "Eklendi", again: "Baştan başla", also: "Bunları da dene", back: "Geri" },
};

// Küçük harf: Türkçe "İ" ve İngilizce "I" ikisi de "i" (Türkçe kuralıyla "Iris" → "ırıs" olmasın).
export const low = (s = "") => s.replace(/[İI]/g, "i").toLowerCase();

export function profile(prod) {
  const lines = [...(prod.composition ?? []), ...(prod.en?.composition ?? []), ...(prod.notes ?? []), ...(prod.en?.notes ?? []), prod.en?.family ?? prod.family ?? "", ""].join(", ");
  const text = low(lines);
  const v = {};
  let n = 0;
  for (const [f, keys] of Object.entries(FAM)) {
    v[f] = keys.reduce((s, k) => s + (text.split(k).length - 1), 0);
    n += v[f];
  }
  for (const f in v) v[f] = n ? v[f] / n : 0;
  return v;
}

// content.finder.categories: yalnızca bu kategorilerdeki ürünler önerilir (ör. parfümler; oda spreyi değil).
const ONLY = content.finder?.categories;
const ITEMS = (C?.items ?? [])
  .filter((i) => i.product != null && i.image && (!ONLY || ONLY.includes(i.category)))
  .map((i) => ({ item: i, prod: content.products[i.product], vec: profile(content.products[i.product]) }))
  .filter((x) => Object.values(x.vec).some((v) => v > 0));
export const FINDER = content.finder !== false && ITEMS.length >= 3;
// 3B sergi görselleri (catalog.items[].exhibit: ürün kaidesiyle birlikte, şeffaf zemin; wall: ürünün sahne duvarı;
// theme.plinthImage: boş kaide): CSS kaide yerine bunlar kullanılır, ürün kaidenin tam üstünde durur.
const EXHIBIT = ITEMS.some((x) => x.item.exhibit);

export default function Finder() {
  const t = useT();
  const L = t.lang === "en" ? "en" : "tr";
  // Başka dilde (ör. Macarca) metinler ve sorular: content.ui.<dil>.finder {eyebrow, title, …, questions}.
  const T = { ...TXT[L], ...(t.ui.finder ?? {}) };
  const qs = t.ui.finder?.questions ?? Q[L];
  const [answers, setAnswers] = useState([]);
  const [added, setAdded] = useState(false);
  const addToCart = useStore((s) => s.addToCart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const step = answers.length;
  const done = step >= qs.length;

  const ranked = useMemo(() => {
    if (!done) return [];
    const want = { fresh: 0, floral: 0, sweet: 0, warm: 0 };
    answers.forEach((a, k) => {
      const w = k === 0 ? 2 : 1;
      for (const f in qs[k][1][a][1]) want[f] += w * qs[k][1][a][1][f];
    });
    return ITEMS.map((x) => ({ ...x, score: Object.keys(want).reduce((s, f) => s + want[f] * x.vec[f], 0) })).sort((a, b) => b.score - a.score);
  }, [done, answers, qs]);

  // Telefonda sonuç çıkınca kaide ekrana gelsin (şişe iniyor).
  useEffect(() => {
    if (done && window.matchMedia("(max-width: 900px)").matches) scrollToElement(document.getElementById("finder"));
  }, [done]);

  const win = ranked[0];
  const prod = win?.prod;
  const P = prod && L === "en" && prod.en ? prod.en : prod;
  const theme = prod?.theme ?? {};
  const pal = win ? { "--glow": win.item.bg ?? theme.glow, "--drop": win.item.bg2 ?? theme.drop, "--edge": theme.edge ?? "#120c0a" } : {};
  const name = win ? win.item.name[L] ?? win.item.name.tr : "";

  const open = (item) => {
    const idx = flavors.findIndex((f) => f.gid === item.product);
    if (idx >= 0) window.dispatchEvent(new CustomEvent("open-product", { detail: { index: idx } }));
    else window.location.hash = `#/urunler/${item.category}/${item.id}`;
  };
  const add = () => {
    addToCart(`c:${win.item.id}`, 1, "once", 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
    setTimeout(() => setCartOpen(true), 250);
  };

  return (
    <section id="finder" className={`section finder${done ? " is-done" : ""}`} style={{ "--plinth": THEME.plinthColor ?? "#f1ebe3", ...pal }}>
      <div className="finder__room" aria-hidden="true">
        <div className="epi-wall" />
        {EXHIBIT && win?.item.wall && <div key={`w-${win.item.id}`} className="epi-photo" style={{ backgroundImage: `url(${BASE}${win.item.wall})` }} />}
        <div className="epi-silk">
          <i />
          <i />
          <i />
        </div>
        <div className="epi-floor" />
        <div className={`epi-exhibit finder__exhibit${EXHIBIT ? " has-img" : ""}`}>
          <div className="epi-halo" />
          {win && (
            <div key={win.item.id} className="finder__drop">
              {(prod.garnish ?? []).map((g, k) => (
                <img
                  key={g.file}
                  className="finder__garnish"
                  src={`${BASE}${g.file}`}
                  alt=""
                  style={{ "--gx": g.x, "--gy": g.y, "--gw": g.w, "--gh": g.h, "--gs": Math.sign(g.x) || 1, "--gk": k }}
                />
              ))}
              {EXHIBIT && win.item.exhibit ? (
                <img className="epi-img finder__set" src={`${BASE}${win.item.exhibit}`} alt="" />
              ) : (
                <img className="finder__bottle" src={`${BASE}${win.item.image}`} alt="" />
              )}
              <div className="epi-puff" />
            </div>
          )}
          {EXHIBIT ? (
            !win && THEME.plinthImage && <img className="epi-img" src={`${BASE}${THEME.plinthImage}`} alt="" />
          ) : (
            <div className="epi-plinth">
              <span />
            </div>
          )}
          {!win && <p className="finder__empty mono">{T.empty}</p>}
        </div>
        <div className="epi-vignette" />
      </div>

      <div className="finder__card">
        {!done ? (
          <div key={step} className="finder__step">
            <p className="mono section__eyebrow">
              {T.eyebrow} · {String(step + 1).padStart(2, "0")} — {String(qs.length).padStart(2, "0")}
            </p>
            {step === 0 && (
              <>
                <h2 className="section__title">{T.title}</h2>
                <p className="finder__lead">{T.lead}</p>
              </>
            )}
            <h3 className="finder__q">{qs[step][0]}</h3>
            <div className="finder__opts">
              {qs[step][1].map(([label], k) => (
                <button key={label} className="finder__opt" onClick={() => setAnswers([...answers, k])}>
                  <span className="mono">{String.fromCharCode(65 + k)}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="finder__bar" aria-hidden="true">
              {qs.map((_, k) => (
                <i key={k} className={k < step ? "is-on" : k === step ? "is-cur" : ""} />
              ))}
            </div>
            {step > 0 && (
              <button className="finder__back mono" onClick={() => setAnswers(answers.slice(0, -1))}>
                ← {T.back}
              </button>
            )}
          </div>
        ) : (
          <div key={win.item.id} className="finder__step finder__result">
            <p className="mono section__eyebrow">{T.result}</p>
            <h2 className="finder__name" lang={termLang(name) ?? t.nameLang}>{name}</h2>
            {P?.tagline && <p className="finder__lead">{P.tagline}</p>}
            {P?.notes?.length > 0 && (
              <ul className="finder__notes">
                {P.notes.slice(0, 5).map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <p className="finder__price">{t.tagPrice(win.item.size, `c:${win.item.id}`)}</p>
            <div className="finder__acts">
              <button className="pill" onClick={() => open(win.item)}>
                {T.discover} →
              </button>
              <button className={`finder__add${added ? " is-added" : ""}`} onClick={add}>
                {added ? T.added : T.add}
              </button>
            </div>
            {ranked.length > 2 && (
              <div className="finder__also">
                <p className="mono">{T.also}</p>
                {ranked.slice(1, 3).map((r) => (
                  <button key={r.item.id} onClick={() => open(r.item)}>
                    <img src={`${BASE}${r.item.image}`} alt="" loading="lazy" />
                    <span>{r.item.name[L] ?? r.item.name.tr}</span>
                  </button>
                ))}
              </div>
            )}
            {content.discovery && (
              <a className="finder__disco" href="#discovery">
                <span className="mono">{T.cantDecide ?? (L === "en" ? "Can’t decide?" : "Karar veremedin mi?")}</span> {T.tryAll ?? (L === "en" ? "Try all nine" : "Dokuzunu da dene")} · {content.discovery.title} →
              </a>
            )}
            <button className="finder__back mono" onClick={() => setAnswers([])}>
              ↺ {T.again}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
