import { useState } from "react";

import { VARIETY, flavorName, flavors, money, packLabel, packPrice, packs, SUB_DISCOUNT, FREE_SHIPPING } from "../data";
import { shopFlavorOf, useStore } from "../store";
import { Minus, Plus } from "../Icons";

// Paketini oluştur: tat, paket boyutu ve abonelik seçimi. Seçilen tat
// sağdaki 3B kutuda gürültülü geçişle görünür.
export default function Shop() {
  const flavor = useStore(shopFlavorOf);
  const pack = useStore((s) => s.shopPack);
  const plan = useStore((s) => s.shopPlan);
  const setShop = useStore((s) => s.setShop);
  const addToCart = useStore((s) => s.addToCart);
  const [qty, setQty] = useState(1);

  const unit = packPrice(pack, plan);
  const full = packPrice(pack, "once");
  const perCan = unit / pack;

  return (
    <section
      id="shop"
      className="shop"
      style={flavor === VARIETY ? undefined : { "--accent": flavors[flavor].color }}
    >
      <div className="shop__panel">
        <header className="shop__head">
          <p className="mono section__eyebrow">03 — Mağaza</p>
          <h2 className="section__title">Paketini oluştur</h2>
          <p className="tagline tagline--static">Tadını seç, boyutunu seç. Gerisini soğuk tutarız.</p>
        </header>

        <fieldset className="field">
          <legend className="mono">
            Tat <b>{flavorName(flavor)}</b>
          </legend>
          <div className="swatches">
            {flavors.map((f, i) => (
              <button
                key={f.name}
                className={`swatch${flavor === i ? " is-on" : ""}`}
                style={{ "--c": f.color }}
                aria-label={f.name}
                aria-pressed={flavor === i}
                onClick={() => setShop({ shopFlavor: i })}
              />
            ))}
            <button
              className={`swatch swatch--variety${flavor === VARIETY ? " is-on" : ""}`}
              aria-pressed={flavor === VARIETY}
              onClick={() => setShop({ shopFlavor: VARIETY })}
            >
              Karışık
            </button>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">Paket boyutu</legend>
          <div className="packs">
            {packs.map((p) => (
              <button
                key={p.size}
                className={`pack${pack === p.size ? " is-on" : ""}`}
                aria-pressed={pack === p.size}
                onClick={() => setShop({ shopPack: p.size })}
              >
                <span className="pack__size">{p.size}</span>
                <span className="pack__cans mono">kutu</span>
                <span className="pack__per">Kutu başı {money(packPrice(p.size, plan) / p.size)}</span>
                <span className="pack__label mono">{p.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">Teslimat</legend>
          <div className="plans">
            <label className={`plan${plan === "once" ? " is-on" : ""}`}>
              <input type="radio" name="plan" id="plan-once" checked={plan === "once"} onChange={() => setShop({ shopPlan: "once" })} />
              <span>Tek seferlik alım</span>
              <span className="plan__price">{money(full)}</span>
            </label>
            <label className={`plan${plan === "sub" ? " is-on" : ""}`}>
              <input type="radio" name="plan" id="plan-sub" checked={plan === "sub"} onChange={() => setShop({ shopPlan: "sub" })} />
              <span>
                Abone ol, %{Math.round(SUB_DISCOUNT * 100)} tasarruf et
                <small>4 haftada bir · istediğin zaman atla ya da iptal et</small>
              </span>
              <span className="plan__price">{money(packPrice(pack, "sub"))}</span>
            </label>
          </div>
        </fieldset>

        <div className="checkout-row">
          <div className="price">
            <span className="price__now">{money(unit * qty)}</span>
            {plan === "sub" && <s className="price__was">{money(full * qty)}</s>}
            <span className="price__per mono">
              {packLabel(pack)} paket · kutu başı {money(perCan)}
            </span>
          </div>
          <div className="qty" aria-label="Adet">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Adedi azalt"><Minus /></button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Adedi artır"><Plus /></button>
          </div>
          <button className="pill pill--wide" onClick={() => addToCart(flavor, pack, plan, qty)}>
            Sepete ekle
          </button>
        </div>

        <ul className="perks mono">
          <li>{money(FREE_SHIPPING)} üzeri ücretsiz kargo</li>
          <li>24 saatte kargoda</li>
          <li>Geri dönüştürülebilir alüminyum</li>
        </ul>
      </div>
    </section>
  );
}
