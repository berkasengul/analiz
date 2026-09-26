import { useState } from "react";

import { CHECKOUT_URL } from "../config";
import { FREE_SHIPPING, SHIPPING, VARIETY, flavorName, flavors, money, packPrice } from "../data";
import { scrollToElement } from "../scroll";
import { useStore } from "../store";
import { Close, Minus, Plus } from "../Icons";

export default function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const cart = useStore((s) => s.cart);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const setQty = useStore((s) => s.setQty);
  const [notice, setNotice] = useState(false);

  const subtotal = cart.reduce((n, i) => n + packPrice(i.pack, i.plan) * i.qty, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING;
  const left = Math.max(0, FREE_SHIPPING - subtotal);
  const tab = open ? 0 : -1;

  const checkout = () => {
    if (!CHECKOUT_URL) {
      setNotice(true);
      return;
    }
    const items = cart.map((i) => ({ flavor: flavorName(i.flavor), pack: i.pack, plan: i.plan, qty: i.qty }));
    window.location.href = `${CHECKOUT_URL}${CHECKOUT_URL.includes("?") ? "&" : "?"}items=${encodeURIComponent(JSON.stringify(items))}`;
  };

  return (
    <div className={`drawer${open ? " is-open" : ""}`} aria-hidden={!open}>
      <button className="drawer__scrim" onClick={() => setCartOpen(false)} tabIndex={-1} aria-label="Close cart" />
      <aside className="drawer__panel" aria-label="Your box">
        <header className="drawer__head">
          <h2>Your box</h2>
          <button className="round" onClick={() => setCartOpen(false)} tabIndex={tab} aria-label="Close cart">
            <Close />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="drawer__empty">
            <p className="tagline tagline--static">Nothing in here yet.</p>
            <button
              className="pill"
              tabIndex={tab}
              onClick={() => {
                setCartOpen(false);
                scrollToElement(document.getElementById("shop"));
              }}
            >
              Build a box
            </button>
          </div>
        ) : (
          <>
            <div className="ship">
              <p className="mono">
                {left > 0 ? `${money(left)} away from free shipping` : "Free shipping unlocked"}
              </p>
              <div className="ship__bar">
                <span style={{ transform: `scaleX(${Math.min(1, subtotal / FREE_SHIPPING)})` }} />
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
                          : flavors[i.flavor].color,
                    }}
                  />
                  <div className="line__info">
                    <p className="line__name">
                      {flavorName(i.flavor)} · {i.pack}-pack
                    </p>
                    <p className="mono">{i.plan === "sub" ? "Every 4 weeks · −15%" : "One-time"}</p>
                    <div className="qty qty--sm">
                      <button onClick={() => setQty(i.id, i.qty - 1)} tabIndex={tab} aria-label="Decrease quantity">
                        <Minus />
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} tabIndex={tab} aria-label="Increase quantity">
                        <Plus />
                      </button>
                    </div>
                  </div>
                  <div className="line__end">
                    <p>{money(packPrice(i.pack, i.plan) * i.qty)}</p>
                    <button className="line__remove mono" onClick={() => setQty(i.id, 0)} tabIndex={tab}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="drawer__foot">
              <dl className="totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>Shipping</dt>
                  <dd>{shipping === 0 ? "Free" : money(shipping)}</dd>
                </div>
                <div className="totals__total">
                  <dt>Total</dt>
                  <dd>{money(subtotal + shipping)}</dd>
                </div>
              </dl>
              <button className="pill pill--wide" onClick={checkout} tabIndex={tab}>
                Checkout
              </button>
              {notice && (
                <p className="drawer__notice" role="status">
                  Online checkout opens soon. Your box is saved on this device until then.
                </p>
              )}
              <p className="mono drawer__small">Taxes included · EU delivery in 1–3 days</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
