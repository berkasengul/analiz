import { useState } from 'react';
import { useStore } from '../../store';
import { copy, contact } from '../../data/copy';

export function Contact() {
  const lang = useStore((s) => s.lang);
  const t = copy[lang].contact;
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [news, setNews] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `${form.message}\n\n— ${form.name} <${form.email}>`;
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(t.mailSubject)}&body=${encodeURIComponent(body)}`;
  };
  const join = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(t.newsSubject)}&body=${encodeURIComponent(news)}`;
  };

  return (
    <section id="contact" className="opaque contact" aria-label={t.label}>
      <div className="wrap">
        <div className="contact-grid">
          <form className="contact-form" onSubmit={send}>
            <p className="eyebrow accent-text">{t.label}</p>
            <h2 className="h-section">{t.title}</h2>
            <p className="muted">{t.desc}</p>
            <div className="field-row">
            <label className="field">
              <span>{t.name}</span>
              <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="field">
              <span>{t.email}</span>
              <input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            </div>
            <label className="field">
              <span>{t.message}</span>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </label>
            <button className="btn btn-accent" type="submit">{t.send}</button>
          </form>
          <form className="newsletter" onSubmit={join}>
            <p className="eyebrow accent-text">{t.newsTitle}</p>
            <p className="news-desc">{t.newsDesc}</p>
            <div className="news-row">
              <label className="field field-inline">
                <span className="sr-only">{t.newsPlaceholder}</span>
                <input required type="email" placeholder={t.newsPlaceholder} value={news} onChange={(e) => setNews(e.target.value)} autoComplete="email" />
              </label>
              <button className="btn btn-accent" type="submit">{t.join}</button>
            </div>
          </form>
        </div>
        <dl className="contact-cols">
          <div><dt className="eyebrow">{t.cols.email}</dt><dd><a href={`mailto:${contact.email}`}>{contact.email}</a></dd></div>
          <div><dt className="eyebrow">{t.cols.phone}</dt><dd><a href={contact.phoneHref}>{contact.phone}</a></dd></div>
          <div><dt className="eyebrow">{t.cols.instagram}</dt><dd><a href={contact.instagramHref} target="_blank" rel="noopener noreferrer">{contact.instagram}</a></dd></div>
          <div><dt className="eyebrow">{t.cols.address}</dt><dd>{contact.address[0]}<br />{contact.address[1]}</dd></div>
        </dl>
      </div>
    </section>
  );
}
