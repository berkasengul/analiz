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
  const [notice, setNotice] = useState(false);

  const t = useT();
  const { ui, money } = t;
  const subtotal = cart.reduce((n, i) => n + t.price(i.pack, i.plan, i.flavor) * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= t.freeShipping ? 0 : t.shipping;
  const left = Math.max(0, t.freeShipping - subtotal);
  const tab = open ? 0 : -1;

  const checkout = () => {
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
                scrollToElement(document.getElementById("shop"));
              }}
            >
              {ui.buildBox}
            </button>
          </div>
        ) : (
          <>
            <div className="ship">
              <p className="mono">
                {left > 0 ? ui.toFree(money(left)) : ui.freeUnlocked}
              </p>
              <div className="ship__bar">
                <span style={{ transform: `scaleX(${Math.min(1, subtotal / t.freeShipping)})` }} />
              </div>
            </div>

            <ul className="lines" data-lenis-prevent>
              {cart.map((i) => (
                <li key={i.id} className="line">
                  <span
                    className="line__swatch"
                    style={{
                      background:
                        i.flavor === VARIETY
                          ? `conic-gradient(${flavors.map((f) => f.color).join(",")})`
                          : t.catalogItem(i.flavor)?.color ?? flavors[i.flavor]?.color ?? "#888",
                    }}
                  />
                  <div className="line__info">
                    <p className="line__name">
                      {t.flavorName(i.flavor)} · {ui.pack(t.packLabel(i.pack))}
                    </p>
                    <p className="mono">{i.plan === "sub" ? ui.subLine(t.subPct) : ui.oneTime}</p>
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
                  <dd>{shipping === 0 ? ui.free : money(shipping)}</dd>
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
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
