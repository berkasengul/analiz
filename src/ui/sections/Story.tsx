import { useStore } from '../../store';
import { copy } from '../../data/copy';

export function Story() {
  const lang = useStore((s) => s.lang);
  const t = copy[lang];
  return (
    <section id="story" className="opaque story" aria-label={t.story.label}>
      <div className="wrap story-grid">
        <div className="story-left">
          <p className="eyebrow accent-text">{t.story.label}</p>
          <h2 className="story-title">{t.story.title}</h2>
          <p className="story-motto">{t.motto}</p>
          {t.story.paragraphs.map((p) => <p key={p} className="story-p">{p}</p>)}
          <div className="story-sign">
            <span className="badge-logo" aria-hidden="true"><img src="/brand/logo.png" alt="" width={56} height={18} /></span>
            <span>{t.story.place}</span>
          </div>
          <p className="eyebrow story-seen">{t.story.seen}: <strong>Vogue Türkiye</strong></p>
        </div>
        <div className="story-right">
          <ol className="timeline">
            {t.story.timeline.map(([h, d]) => (
              <li key={h}><strong>{h}</strong><span>{d}</span></li>
            ))}
          </ol>
          <div className="stats">
            {t.story.stats.map(([n, l]) => (
              <div key={l} className="stat"><strong>{n}</strong><span>{l}</span></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
