import { useState } from "react";

import { CHECKOUT_URL } from "../config";
import { VARIETY, flavors } from "../data";
import { useT } from "../i18n";
import { scrollToElement } from "../scroll";
import { useStore } from "../store";
import { Close, Minus, Plus } from "../Icons";

export default function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setQty = useStore((s) => s.setQty);
  const setVariant = useStore((s) => s.setVariant);
  const [notice, setNotice] = useState(false);

  const t = useT();
  const { ui, money } = t;
  const subtotal = cart.reduce((n, i) => n + t.price(i.pack, i.plan, i.flavor) * i.qty, 0);
  const C = t.commerce;
  // Sepet hedefi: markanın hediye eşiği (commerce.goal) ya da ücretsiz kargo sınırı.
  const goal = C.goal ?? t.freeShipping;
  const shipping = C.shippingAtCheckout || subtotal === 0 || subtotal >= t.freeShipping ? 0 : t.shipping;
  const left = Math.max(0, goal - subtotal);
  const itemOf = (i) => t.catalogItem(i.flavor);
  const variantOf = (i) => i.variant ?? itemOf(i)?.variants?.[0]?.id;
  const tab = open ? 0 : -1;

  const checkout = () => {
    // Shopify mağazası: ürünler markanın kendi sepetine eklenip ödeme sayfası açılır.
    if (C.shopify && cart.every((i) => variantOf(i))) {
      const lines = cart.map((i) => `${variantOf(i)}:${i.qty * i.pack}`).join(",");
      window.location.href = `${C.shopify.replace(/\/$/, "")}/cart/${lines}`;
      return;
    }
    if (!CHECKOUT_URL) {
      setNotice(true);
      return;
    }
    const items = cart.map((i) => ({ flavor: t.flavorName(i.flavor), currency: t.lang === "en" ? "USD" : "TRY", pack: i.pack, plan: i.plan, qty: i.qty }));
    window.location.href = `${CHECKOUT_URL}${CHECKOUT_URL.includes("?") ? "&" : "?"}items=${encodeURIComponent(JSON.stringify(items))}`;
  };

  return (
    <div className={`drawer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="drawer__scrim" onClick={() => setCartOpen(false)} tabIndex={-1} aria-label={ui.closeCart} />
      <aside className="drawer__panel" aria-label={ui.cart}>
        <header className="drawer__head">
          <h2>{ui.cart}</h2>
          <button className="round" onClick={() => setCartOpen(false)} tabIndex={tab} aria-label={ui.closeCart}>
            <Close />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="drawer__empty">
            <p className="tagline tagline--static">{ui.emptyCart}</p>
            <button
              className="pill"
              tabIndex={tab}
              onClick={() => {
                setCartOpen(false);
                // Mağaza bölümü yalnızca ana sayfada; diğer sayfalarda ürün listesine gidilir.
                const shop = document.getElementById("shop");
                if (shop) scrollToElement(shop);
                else window.location.hash = "#/urunler";
              }}
            >
              {ui.buildBox}
            </button>
          </div>
        ) : (
          <>
            <div className="ship">
              <p className="mono">
                {C.goal ? (left > 0 ? ui.goalLeft(money(left)) : ui.goalDone) : left > 0 ? ui.toFree(money(left)) : ui.freeUnlocked}
              </p>
              <div className="ship__bar">
                <span style={{ transform: `scaleX(${Math.min(1, subtotal / goal)})` }} />
              </div>
            </div>

            <ul className="lines" data-lenis-prevent>
              {cart.map((i) => (
                <li key={i.id} className="line">
                  {itemOf(i)?.image ? (
                    <span className="line__thumb" style={{ "--c": itemOf(i).color }}>
                      <img src={import.meta.env.BASE_URL + itemOf(i).image} alt="" />
                    </span>
                  ) : (
                    <span
                      className="line__swatch"
                      style={{
                        background:
                          i.flavor === VARIETY
                            ? `conic-gradient(${flavors.map((f) => f.color).join(",")})`
                            : itemOf(i)?.color ?? flavors[i.flavor]?.color ?? "#888",
                      }}
                    />
                  )}
                  <div className="line__info">
                    <p className="line__name">
                      {t.flavorName(i.flavor)}
                      {C.packs !== false && <> · {ui.pack(t.packLabel(i.pack))}</>}
                    </p>
                    {C.plans !== false && <p className="mono">{i.plan === "sub" ? ui.subLine(t.subPct) : ui.oneTime}</p>}
                    {itemOf(i)?.variants?.length > 1 && (
                      <label className="line__variant mono">
                        <span>{ui.variant}</span>
                        <select value={variantOf(i)} onChange={(e) => setVariant(i.id, Number(e.target.value))} tabIndex={tab}>
                          {itemOf(i).variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="qty qty--sm">
                      <button onClick={() => setQty(i.id, i.qty - 1)} tabIndex={tab} aria-label={ui.dec}>
                        <Minus />
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} tabIndex={tab} aria-label={ui.inc}>
                        <Plus />
                      </button>
                    </div>
                  </div>
                  <div className="line__end">
                    <p>{money(t.price(i.pack, i.plan, i.flavor) * i.qty)}</p>
                    <button className="line__remove mono" onClick={() => setQty(i.id, 0)} tabIndex={tab}>
                      {ui.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="drawer__foot">
              <dl className="totals">
                <div>
                  <dt>{ui.subtotal}</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>{ui.shipping}</dt>
                  <dd>{C.shippingAtCheckout ? ui.shipLater : shipping === 0 ? ui.free : money(shipping)}</dd>
                </div>
                <div className="totals__total">
                  <dt>{ui.total}</dt>
                  <dd>{money(subtotal + shipping)}</dd>
                </div>
              </dl>
              <button className="pill pill--wide" onClick={checkout} tabIndex={tab}>
                {ui.checkout}
              </button>
              {notice && (
                <p className="drawer__notice" role="status">
                  {ui.checkoutSoon}
                </p>
              )}
              <p className="mono drawer__small">{ui.taxes}</p>
              {C.shopify && ui.checkoutNote && <p className="mono drawer__small">{ui.checkoutNote}</p>}
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
