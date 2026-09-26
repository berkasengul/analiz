import { useState } from "react";

import { VARIETY, flavors } from "../data";
import { useT } from "../i18n";
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

  const t = useT();
  const { ui, money } = t;
  const unit = t.price(pack, plan, flavor);
  const full = t.price(pack, "once", flavor);
  const perCan = unit / pack;

  return (
    <section
      id="shop"
      className="shop"
      style={flavor === VARIETY ? undefined : { "--accent": flavors[flavor].color }}
    >
      <div className="shop__panel">
        <header className="shop__head">
          <p className="mono section__eyebrow">{ui.shopEyebrow}</p>
          <h2 className="section__title">{ui.shopTitle}</h2>
          <p className="tagline tagline--static">{ui.shopTag}</p>
        </header>

        <fieldset className="field">
          <legend className="mono">
            {ui.flavor} <b lang={flavor === VARIETY ? undefined : t.nameLang}>{t.flavorName(flavor)}</b>
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
              {ui.mix}
            </button>
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">{ui.size}</legend>
          <div className="packs">
            {t.packs.map((p) => (
              <button
                key={p.size}
                className={`pack${pack === p.size ? " is-on" : ""}`}
                aria-pressed={pack === p.size}
                onClick={() => setShop({ shopPack: p.size })}
              >
                <span className="pack__size">{p.size}</span>
                <span className="pack__cans mono">{ui.cans}</span>
                <span className="pack__per">{ui.perCan(money(t.price(p.size, plan, flavor)))}</span>
                <span className="pack__label mono">{p.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend className="mono">{ui.delivery}</legend>
          <div className="plans">
            <label className={`plan${plan === "once" ? " is-on" : ""}`}>
              <input type="radio" name="plan" id="plan-once" checked={plan === "once"} onChange={() => setShop({ shopPlan: "once" })} />
              <span>{ui.once}</span>
              <span className="plan__price">{money(full)}</span>
            </label>
            <label className={`plan${plan === "sub" ? " is-on" : ""}`}>
              <input type="radio" name="plan" id="plan-sub" checked={plan === "sub"} onChange={() => setShop({ shopPlan: "sub" })} />
              <span>
                {ui.subscribe(t.subPct)}
                <small>{ui.subNote}</small>
              </span>
              <span className="plan__price">{t.subPct > 0 ? money(t.price(pack, "sub", flavor)) : ui.free}</span>
            </label>
          </div>
        </fieldset>

        <div className="checkout-row">
          <div className="price">
            <span className="price__now">{money(unit * qty)}</span>
            {plan === "sub" && t.subPct > 0 && <s className="price__was">{money(full * qty)}</s>}
            <span className="price__per mono">
              {ui.packPerCan(t.packLabel(pack), money(perCan))}
            </span>
          </div>
          <div className="qty" aria-label={ui.qty}>
            <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label={ui.dec}><Minus /></button>
            <span aria-live="polite">{qty}</span>
            <button onClick={() => setQty(qty + 1)} aria-label={ui.inc}><Plus /></button>
          </div>
          <button className="pill pill--wide" onClick={() => addToCart(flavor, pack, plan, qty)}>
            {ui.addToCart}
          </button>
        </div>

        <ul className="perks mono">
          <li>{ui.freeOver(money(t.freeShipping))}</li>
          <li>{ui.ships}</li>
          <li>{ui.recyclable}</li>
        </ul>
      </div>
    </section>
  );
}
