import { useStore } from '../../store';
import { copy, contact } from '../../data/copy';
import { scrollToSection } from '../../scroll/scroll';

export function Footer() {
  const lang = useStore((s) => s.lang);
  const t = copy[lang].footer;
  const items = [...t.marquee, ...t.marquee];
  return (
    <footer className="opaque footer">
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {items.map((x, i) => (
            <span key={i}>{x}<i>✦</i></span>
          ))}
        </div>
      </div>
      <p className="sr-only">{t.marquee.join(' · ')}</p>
      <div className="wrap">
        <p className="footer-demo">{t.demo}</p>
        <div className="social">
          <a className="social__card" href={contact.instagramHref} target="_blank" rel="noopener noreferrer">
            <span className="eyebrow">Instagram</span>
            <strong>{contact.instagram}</strong>
            <span className="social__arrow" aria-hidden="true">↗</span>
          </a>
          <a className="social__card" href={contact.shop} target="_blank" rel="noopener noreferrer">
            <span className="eyebrow">Web</span>
            <strong>unbeperfumes.com</strong>
            <span className="social__arrow" aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="footer-row">
          <p className="footer-line">{t.line}</p>
          <nav className="footer-links" aria-label="Footer">
            <button onClick={() => scrollToSection('shop')}>{t.links.shop}</button>
            <button onClick={() => scrollToSection('faq')}>{t.links.faq}</button>
            <button onClick={() => scrollToSection('story')}>{t.links.story}</button>
            <button onClick={() => scrollToSection('contact')}>{t.links.contact}</button>
          </nav>
          <p className="footer-line footer-line--muted">{lang === 'tr' ? 'UnBe. için hazırlanmış konsept demo' : 'Concept demo prepared for UnBe.'}</p>
        </div>
      </div>
    </footer>
  );
}
