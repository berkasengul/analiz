import { useState } from "react";

import { CHECKOUT_URL } from "../config";
import { FREE_SHIPPING, SHIPPING, VARIETY, flavorName, flavors, money, packLabel, packPrice } from "../data";
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
      <button className="drawer__scrim" onClick={() => setCartOpen(false)} tabIndex={-1} aria-label="Sepeti kapat" />
      <aside className="drawer__panel" aria-label="Sepetin">
        <header className="drawer__head">
          <h2>Sepetin</h2>
          <button className="round" onClick={() => setCartOpen(false)} tabIndex={tab} aria-label="Sepeti kapat">
            <Close />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="drawer__empty">
            <p className="tagline tagline--static">Sepetin henüz boş.</p>
            <button
              className="pill"
              tabIndex={tab}
              onClick={() => {
                setCartOpen(false);
                scrollToElement(document.getElementById("shop"));
              }}
            >
              Paket oluştur
            </button>
          </div>
        ) : (
          <>
            <div className="ship">
              <p className="mono">
                {left > 0 ? `Ücretsiz kargoya ${money(left)} kaldı` : "Ücretsiz kargo kazandın"}
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
                      {flavorName(i.flavor)} · {packLabel(i.pack)} paket
                    </p>
                    <p className="mono">{i.plan === "sub" ? "4 haftada bir · %15 indirim" : "Tek seferlik"}</p>
                    <div className="qty qty--sm">
                      <button onClick={() => setQty(i.id, i.qty - 1)} tabIndex={tab} aria-label="Adedi azalt">
                        <Minus />
                      </button>
                      <span>{i.qty}</span>
                      <button onClick={() => setQty(i.id, i.qty + 1)} tabIndex={tab} aria-label="Adedi artır">
                        <Plus />
                      </button>
                    </div>
                  </div>
                  <div className="line__end">
                    <p>{money(packPrice(i.pack, i.plan) * i.qty)}</p>
                    <button className="line__remove mono" onClick={() => setQty(i.id, 0)} tabIndex={tab}>
                      Kaldır
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="drawer__foot">
              <dl className="totals">
                <div>
                  <dt>Ara toplam</dt>
                  <dd>{money(subtotal)}</dd>
                </div>
                <div>
                  <dt>Kargo</dt>
                  <dd>{shipping === 0 ? "Ücretsiz" : money(shipping)}</dd>
                </div>
                <div className="totals__total">
                  <dt>Toplam</dt>
                  <dd>{money(subtotal + shipping)}</dd>
                </div>
              </dl>
              <button className="pill pill--wide" onClick={checkout} tabIndex={tab}>
                Ödemeye geç
              </button>
              {notice && (
                <p className="drawer__notice" role="status">
                  Online ödeme çok yakında açılıyor. Sepetin o zamana kadar bu cihazda saklanır.
                </p>
              )}
              <p className="mono drawer__small">KDV dahil · 1–3 iş gününde teslimat</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
