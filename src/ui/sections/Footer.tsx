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
      <div className="wrap footer-row">
        <p className="footer-line">{t.line}</p>
        <nav className="footer-links" aria-label="Footer">
          <button onClick={() => scrollToSection('shop')}>{t.links.shop}</button>
          <button onClick={() => scrollToSection('faq')}>{t.links.faq}</button>
          <button onClick={() => scrollToSection('story')}>{t.links.story}</button>
          <button onClick={() => scrollToSection('contact')}>{t.links.contact}</button>
          <a href={contact.instagramHref} target="_blank" rel="noopener noreferrer">{contact.instagram} ↗</a>
          <a href={contact.shop} target="_blank" rel="noopener noreferrer">{t.links.web} ↗</a>
        </nav>
      </div>
      <p className="wrap footer-demo">{t.demo}</p>
    </footer>
  );
}
