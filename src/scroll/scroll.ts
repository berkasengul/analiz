import Lenis from 'lenis';
import { useStore, prefersReducedMotion, type SectionId } from '../store';
import { products } from '../data/products';

export const SECTIONS: SectionId[] = ['flavors', 'ritual', 'pyramid', 'finder', 'all', 'shop', 'story', 'faq', 'contact'];
export const FLAVOR_PAGES = products.length; // 6

export interface Box { top: number; height: number }

let lenis: Lenis | null = null;
const boxes: Partial<Record<SectionId, Box>> = {};
let vh = typeof window !== 'undefined' ? window.innerHeight : 800;
const listeners = new Set<(y: number) => void>();

export const getLenis = () => lenis;
export const viewportH = () => vh;
export const box = (id: SectionId): Box => boxes[id] ?? { top: 0, height: vh };

/** Anlık (yumuşatılmış) kaydırma konumu */
export const scrollY = () => (lenis ? lenis.animatedScroll : window.scrollY);

export function measure() {
  vh = window.innerHeight;
  for (const id of SECTIONS) {
    const el = document.getElementById(id);
    if (el) boxes[id] = { top: el.offsetTop, height: el.offsetHeight };
  }
}

/**
 * Bölüm ilerlemesi 0..1: bölüm üstü ekranın üstüne geldiğinde 0,
 * bölüm altı ekranın altına geldiğinde 1 (pinned bölümler için).
 * Yüksekliği ekran kadar olan bölümlerde, bölüm ekranı tam kapladığında 0 → bir ekran sonra 1.
 */
export function progress(id: SectionId, y = scrollY()): number {
  const b = box(id);
  const span = Math.max(vh, b.height - vh);
  return Math.min(1, Math.max(0, (y - b.top) / span));
}

/** #flavors içinde sürekli koku konumu 0..5 */
export function flavorFloat(y = scrollY()): number {
  const b = box('flavors');
  const step = Math.max(1, (b.height - vh) / (FLAVOR_PAGES - 1));
  return Math.min(FLAVOR_PAGES - 1, Math.max(0, (y - b.top) / step));
}

export function flavorPageY(i: number) {
  const b = box('flavors');
  return b.top + (i * (b.height - vh)) / (FLAVOR_PAGES - 1);
}

export function onScroll(cb: (y: number) => void) {
  listeners.add(cb);
  cb(scrollY());
  return () => { listeners.delete(cb); };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function scrollToY(y: number, duration = 1.4, lock = false, onComplete?: () => void) {
  if (!lenis) { window.scrollTo(0, y); onComplete?.(); return; }
  const reduced = prefersReducedMotion();
  lenis.scrollTo(y, { duration: reduced ? 0 : duration, immediate: reduced, easing: easeInOut, lock, force: true, onComplete });
}

export function scrollToSection(id: SectionId, offset = 0) {
  measure();
  const target = box(id).top + offset;
  const dist = Math.abs(target - scrollY());
  scrollToY(target, Math.min(2.4, 0.9 + dist / 6000));
}

export function scrollToFlavor(i: number) {
  measure();
  scrollToY(flavorPageY(i), 1.6);
}

// ---------------------------------------------------------------------------
// Sayfalı kaydırma (#flavors): tek tekerlek / tek swipe = bir koku.
// ---------------------------------------------------------------------------
const PAGE_DURATION = 1.4;
const WHEEL_LOCK = 1.35;
let lockUntil = 0;
let lastWheelT = 0;
let lastWheelMag = 0;
let tailUntil = 0;

function inFlavorZone(y: number) {
  const b = box('flavors');
  return y >= b.top - 2 && y <= b.top + b.height - vh + 2;
}

function currentPage(y: number) {
  return Math.round(flavorFloat(y));
}

/** sayfa geçişi sürerken (animasyon bitene ve en az 1.35 sn geçene kadar) gelen kaydırmalar yok sayılır */
let paging = false;
function goPage(i: number) {
  lockUntil = performance.now() / 1000 + WHEEL_LOCK;
  paging = true;
  const done = () => { paging = false; };
  scrollToY(flavorPageY(i), PAGE_DURATION, true, done);
  // güvenlik: onComplete gelmezse kilit kalıcı olmasın
  setTimeout(done, (PAGE_DURATION + 1.5) * 1000);
}
const locked = (t: number) => paging || t < lockUntil;

/** true → olay sayfalamaya harcandı */
function pageBy(dir: number, y: number): boolean {
  const next = currentPage(y) + dir;
  if (next < 0 || next > FLAVOR_PAGES - 1) return false;
  goPage(next);
  return true;
}

function onWheel(deltaY: number): boolean {
  const y = lenis ? lenis.targetScroll : window.scrollY;
  if (!inFlavorZone(y)) return false;
  const t = performance.now() / 1000;
  const mag = Math.abs(deltaY);
  const gap = t - lastWheelT;
  const rising = mag > lastWheelMag * 1.4 && mag > 8;
  lastWheelT = t;
  lastWheelMag = mag;
  if (locked(t)) { tailUntil = Math.max(lockUntil, t) + 0.25; return true; }
  if (mag < 1) return true;
  // trackpad ataletinin kuyruğu yeni bir hareket sayılmaz
  if (t < tailUntil && gap < 0.18 && !rising) { tailUntil = t + 0.25; return true; }
  const dir = Math.sign(deltaY);
  const page = currentPage(y);
  if (page + dir < 0 || page + dir > FLAVOR_PAGES - 1) return false; // bölümden çık
  return pageBy(dir, y);
}

let touchY0 = 0;
let touchFired = false;
let touchZone = false;
let touchDir = 0;

function onTouchStart(e: TouchEvent) {
  touchY0 = e.touches[0].clientY;
  touchFired = false;
  touchDir = 0;
  const t = e.target as HTMLElement | null;
  // açık çekmece / menü / yatay kaydırılan sekmeler sayfalamayı tetiklemesin
  const inOverlay = !!t?.closest?.('[role="dialog"], [data-lenis-prevent], .py-tabs');
  touchZone = !inOverlay && inFlavorZone(scrollY());
}

function onTouchMove(e: TouchEvent) {
  if (!touchZone) return;
  const dy = touchY0 - e.touches[0].clientY;
  if (!touchDir && Math.abs(dy) > 6) touchDir = Math.sign(dy);
  if (!touchDir) return;
  const page = currentPage(scrollY());
  const exiting = page + touchDir < 0 || page + touchDir > FLAVOR_PAGES - 1;
  if (exiting && !touchFired) return; // doğal kaydırmayla bölümden çık
  if (e.cancelable) e.preventDefault();
  if (!touchFired && Math.abs(dy) > 40 && !locked(performance.now() / 1000)) {
    touchFired = true;
    pageBy(touchDir, scrollY());
  }
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (t && (t.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'))) return;
  // Boşluk tuşu odaktaki düğmeyi/bağlantıyı etkinleştirsin
  if (e.key === ' ' && t && t.closest('button, a, [role="button"], [role="tab"], [role="radio"]')) return;
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const down = ['ArrowDown', 'PageDown', ' '].includes(e.key) && !e.shiftKey;
  const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey);
  if (!down && !up) return;
  const y = lenis ? lenis.targetScroll : window.scrollY;
  if (!inFlavorZone(y)) return;
  if (locked(performance.now() / 1000)) { e.preventDefault(); return; }
  if (pageBy(down ? 1 : -1, y)) e.preventDefault();
}

// ---------------------------------------------------------------------------

function emit() {
  const y = scrollY();
  const s = useStore.getState();
  s.setActive(Math.round(flavorFloat(y)));
  s.setRitualStep(Math.min(2, Math.floor(progress('ritual', y) * 3)));
  const probe = y + vh * 0.5;
  let cur: SectionId = 'flavors';
  for (const id of SECTIONS) if (box(id).top <= probe) cur = id;
  s.setSection(cur);
  listeners.forEach((cb) => cb(y));
}

export function initScroll() {
  measure();
  const reduced = prefersReducedMotion();
  lenis = new Lenis({
    lerp: reduced ? 1 : 0.09,
    smoothWheel: !reduced,
    autoRaf: true,
    virtualScroll: (data) => {
      if (data.event.type !== 'wheel') return true;
      const consumed = onWheel(data.deltaY);
      if (consumed && data.event.cancelable) data.event.preventDefault();
      return !consumed;
    },
  });
  lenis.on('scroll', emit);
  window.addEventListener('scroll', emit, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('keydown', onKey);
  const onResize = () => { measure(); emit(); };
  window.addEventListener('resize', onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(document.body);
  document.fonts?.ready.then(onResize);
  emit();
  return () => {
    lenis?.destroy();
    lenis = null;
    window.removeEventListener('scroll', emit);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    ro.disconnect();
  };
}
