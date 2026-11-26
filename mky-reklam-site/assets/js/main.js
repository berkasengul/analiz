/* MKY Reklam & Medya — ortak site betiği */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  document.documentElement.classList.remove('no-js');

  /* ---------- açılış: ana sayfada logo loader, diğer sayfalarda perde ---------- */
  const loader = $('#loader');
  const ready = () => body.classList.add('ready', 'loaded');
  if (loader) { addEventListener('load', () => setTimeout(ready, reduce ? 0 : 1000)); setTimeout(ready, 3000); }
  else { requestAnimationFrame(() => setTimeout(ready, 60)); }

  /* sayfa geçişi: site içi linklerde perde kapanır, sonra gidilir */
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const href = a.getAttribute('href') || '';
    if (a.target === '_blank' || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href) || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.pathname === location.pathname && url.hash) return;
    if (reduce) return;
    e.preventDefault();
    body.classList.remove('menu-open');
    body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 520);
  });
  addEventListener('pageshow', e => { if (e.persisted) { body.classList.remove('leaving'); ready(); } });

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- header ---------- */
  const hdr = $('#hdr'), wa = $('.wa'); let last = 0;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('scrolled', y > 40);
    hdr.classList.toggle('hidden', y > last && y > 400 && !body.classList.contains('menu-open'));
    if (wa) wa.classList.toggle('show', y > innerHeight * .5);
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  $('#burger').onclick = () => body.classList.toggle('menu-open');

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- manifesto (kaydırdıkça kelimeler aydınlanır) ---------- */
  const m = $('#manifesto');
  if (m) {
    m.innerHTML = m.textContent.trim().split(/\s+/).map(w =>
      `<span class="w${w.startsWith('*') ? ' hl' : ''}">${w.replace(/\*/g, '')}</span>`).join(' ');
    const words = $$('.w', m);
    const paint = () => {
      const r = m.getBoundingClientRect(), vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (r.height + vh * .35)));
      const n = reduce ? words.length : Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    addEventListener('scroll', paint, { passive: true }); paint();
  }

  /* ---------- özel imleç + mıknatıs buton ---------- */
  if (matchMedia('(pointer:fine)').matches && !reduce) {
    const c = $('.cursor'), d = $('.cursor-dot');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', e => { body.classList.add('moved'); x = e.clientX; y = e.clientY; d.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; });
    (function loop() { cx += (x - cx) * .16; cy += (y - cy) * .16; c.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', e => c.classList.toggle('hover', !!e.target.closest('a,button,label,summary,.svc')));
    $$('.magnet').forEach(mg => {
      mg.addEventListener('mousemove', e => { const r = mg.getBoundingClientRect(); mg.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
      mg.addEventListener('mouseleave', () => mg.style.transform = '');
    });
  }

  /* ---------- portfolyo filtresi (#web, #tabela … ile doğrudan açılır) ---------- */
  const filters = $('.filters');
  if (filters) {
    const cards = $$('.pc');
    const apply = cat => {
      if (!$(`button[data-f="${cat}"]`, filters)) cat = 'all';
      $$('button', filters).forEach(b => b.classList.toggle('on', b.dataset.f === cat));
      cards.forEach(c => c.classList.toggle('hide', cat !== 'all' && !c.dataset.c.split(' ').includes(cat)));
    };
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      apply(b.dataset.f);
      history.replaceState(null, '', b.dataset.f === 'all' ? location.pathname : '#' + b.dataset.f);
    });
    apply(location.hash.slice(1) || 'all');
    addEventListener('hashchange', () => apply(location.hash.slice(1) || 'all'));
  }

  /* ---------- adım adım teklif formu ---------- */
  const wiz = $('#wiz');
  if (wiz) {
    const steps = $$('.wiz-step', wiz), bars = $$('.wiz-bar i'), err = $('.wiz-err', wiz);
    let cur = 0;
    // hizmet sayfasından gelindiyse (?hizmet=slug) o hizmeti seçili getir
    const pre = new URLSearchParams(location.search).get('hizmet');
    if (pre) { const cb = $(`input[name="hizmet"][data-slug="${pre}"]`, wiz); if (cb) cb.checked = true; }
    const show = i => {
      cur = i; steps.forEach((s, k) => s.classList.toggle('on', k === i));
      bars.forEach((b, k) => b.classList.toggle('on', k <= i)); err.textContent = '';
      const top = wiz.getBoundingClientRect().top + scrollY - 140;
      if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
    };
    const valid = i => {
      const s = steps[i];
      if (s.dataset.need === 'hizmet' && !$$('input[name="hizmet"]:checked', s).length) { err.textContent = 'Lütfen en az bir hizmet seçin.'; return false; }
      const bad = $$('input[required],textarea[required]', s).find(f => !f.checkValidity());
      if (bad) { err.textContent = 'Lütfen zorunlu alanları doldurun.'; bad.focus(); return false; }
      return true;
    };
    wiz.addEventListener('click', e => {
      if (e.target.closest('[data-next]')) { e.preventDefault(); if (valid(cur)) show(Math.min(cur + 1, steps.length - 1)); }
      if (e.target.closest('[data-back]')) { e.preventDefault(); show(Math.max(cur - 1, 0)); }
    });
    wiz.addEventListener('submit', e => { if (!valid(cur)) e.preventDefault(); });
    show(0);
  }

  const tt = $('#totop'); if (tt) tt.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
})();
