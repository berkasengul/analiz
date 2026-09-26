import { useState } from "react";

import { VARIETY, flavorName, flavors, money, packPrice, packs, SUB_DISCOUNT, FREE_SHIPPING } from "../data";
import { shopFlavorOf, useStore } from "../store";
import { Minus, Plus } from "../Icons";

// Kutunu oluştur: tat, paket ve abonelik seçimi. Seçilen tat sağdaki 3B
// kutuda gürültülü geçişle görünür.
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
    <section id="shop" className="shop">
      <div className="shop__panel">
        <header className="shop__head">
          <p className="mono section__eyebrow">03 — Shop</p>
          <h2 className="section__title">Build your box</h2>
          <p className="tagline tagline--static">Pick a flavour, pick a size. We&apos;ll keep it cold.</p>
        </header>

        <fieldset className="field">
          <legend className="mono">
            Flavour <b>{flavorName(flavor)}</b>
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
              Mix
            </button>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">Box size</legend>
          <div className="packs">
            {packs.map((p) => (
              <button
                key={p.size}
                className={`pack${pack === p.size ? " is-on" : ""}`}
                aria-pressed={pack === p.size}
                onClick={() => setShop({ shopPack: p.size })}
              >
                <span className="pack__size">{p.size}</span>
                <span className="pack__cans mono">cans</span>
                <span className="pack__per">{money(packPrice(p.size, plan) / p.size)} / can</span>
                <span className="pack__label mono">{p.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">Delivery</legend>
          <div className="plans">
            <label className={`plan${plan === "once" ? " is-on" : ""}`}>
              <input type="radio" name="plan" id="plan-once" checked={plan === "once"} onChange={() => setShop({ shopPlan: "once" })} />
              <span>One-time purchase</span>
              <span className="plan__price">{money(full)}</span>
            </label>
            <label className={`plan${plan === "sub" ? " is-on" : ""}`}>
              <input type="radio" name="plan" id="plan-sub" checked={plan === "sub"} onChange={() => setShop({ shopPlan: "sub" })} />
              <span>
                Subscribe &amp; save {Math.round(SUB_DISCOUNT * 100)}%
                <small>Every 4 weeks · skip or cancel anytime</small>
              </span>
              <span className="plan__price">{money(packPrice(pack, "sub"))}</span>
            </label>
          </div>
        </fieldset>

        <div className="checkout-row">
          <div className="price">
            <span className="price__now">{money(unit * qty)}</span>
            {plan === "sub" && <s className="price__was">{money(full * qty)}</s>}
            <span className="price__per mono">{money(perCan)} per can</span>
          </div>
          <div className="qty" aria-label="Quantity">
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity"><Minus /></button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label="Increase quantity"><Plus /></button>
          </div>
          <button className="pill pill--wide" onClick={() => addToCart(flavor, pack, plan, qty)}>
            Add to box
          </button>
        </div>

        <ul className="perks mono">
          <li>Free shipping over {money(FREE_SHIPPING)}</li>
          <li>Ships in 24 h</li>
          <li>Recyclable aluminium</li>
        </ul>
      </div>
    </section>
  );
}
