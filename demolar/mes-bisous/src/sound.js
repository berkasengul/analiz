import { content } from "./data";
import { scrollState, slotIndex } from "./scroll";
import { sceneState, SPRAY, SPRAY_SLOW } from "./shared";
import { useStore } from "./store";

// Sahnenin sesleri: dosya yok, Web Audio ile üretilir (sayfa hafif kalır). Yalnızca "Parfümü sık":
// kapak kalkınca "tık", basınca buğu fısıltısı, kapanınca "tık". Geçiş, iniş ve ortam sesleri
// (whoosh, chime, ortam tonu) hazır dursa da kendiliğinden çalmaz: content.sceneSounds === true açar.
// Tarayıcılar sesi ancak bir tıklama/dokunmadan sonra başlatır; sprey düğmesine basmak bu tıklamadır.
// content.sound === false ise hiç çalışmaz.

const ENABLED = content.sound !== false;
const SCENE = content.sceneSounds === true;
// A minör pentatonik (A3'ten yukarı): ürün sırasına göre nota.
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99];
export const noteOf = (i) => SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length];

let ctx = null;
let master = null;
let noise = null;
let pad = null;
const listeners = new Set();
export const soundState = { unlocked: false };

const pref = () => useStore.getState().sound !== false;
const notify = () => listeners.forEach((f) => f());
export function onSoundChange(f) {
  listeners.add(f);
  return () => listeners.delete(f);
}

function ensure() {
  if (!ENABLED || typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    // Hafif oda yankısı: kısa, sönümlenen gürültüden üretilmiş dürtü.
    const verb = ctx.createConvolver();
    const len = ctx.sampleRate * 1.8;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    master.connect(ctx.destination);
    master.connect(verb).connect(wet).connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

function setMaster(on) {
  if (!master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(on ? 0.9 : 0, t, on ? 0.25 : 0.08);
}

export function unlock() {
  if (!pref() || !ensure()) return;
  const go = () => {
    soundState.unlocked = ctx.state === "running";
    if (soundState.unlocked) {
      setMaster(true);
      if (SCENE) startPad();
    }
    notify();
  };
  if (ctx.state !== "running") ctx.resume().then(go, go);
  else go();
}

export function setSound(on) {
  useStore.getState().setSound(on);
  if (on) unlock();
  else {
    setMaster(false);
    notify();
  }
}

const live = () => ENABLED && ctx && ctx.state === "running" && pref() && !document.hidden;

function out(pan = 0) {
  const p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
  if (p.pan) p.pan.value = pan;
  p.connect(master);
  return p;
}

// Ürün değişirken: bant geçiren süzgeçten geçen gürültü, frekansı yükselip alçalır (hava akımı).
export function whoosh(dir = 1, strength = 1) {
  if (!live()) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(320, t);
  bp.frequency.exponentialRampToValueAtTime(2100, t + 0.32);
  bp.frequency.exponentialRampToValueAtTime(520, t + 0.85);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16 * strength, t + 0.26);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  src.connect(bp).connect(g);
  if (pan) {
    pan.pan.setValueAtTime(-0.55 * dir, t);
    pan.pan.linearRampToValueAtTime(0.55 * dir, t + 0.85);
    g.connect(pan).connect(master);
  } else g.connect(master);
  src.start(t, Math.random());
  src.stop(t + 1);
}

// Kaideye iniş: cam tınısı (temel + camsı üst tonlar) ve alçak, yumuşak bir dokunuş.
export function chime(i, strength = 1) {
  if (!live()) return;
  const t = ctx.currentTime;
  const f = noteOf(i);
  const bus = out(0);
  [
    [1, 0.11, 2.2],
    [2.01, 0.045, 1.4],
    [3.02, 0.028, 0.9],
    [4.17, 0.012, 0.6],
  ].forEach(([ratio, amp, dec]) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f * ratio;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(amp * strength, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dec + 0.05);
  });
  const k = ctx.createOscillator();
  k.frequency.setValueAtTime(120, t);
  k.frequency.exponentialRampToValueAtTime(48, t + 0.18);
  const kg = ctx.createGain();
  kg.gain.setValueAtTime(0.0001, t);
  kg.gain.exponentialRampToValueAtTime(0.09 * strength, t + 0.01);
  kg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  k.connect(kg).connect(bus);
  k.start(t);
  k.stop(t + 0.25);
  glidePad(i);
}

function tick(at = 0, pitch = 2400, amp = 0.05) {
  if (!live()) return;
  const t = ctx.currentTime + at;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = pitch;
  hp.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(hp).connect(g).connect(out(0.15));
  src.start(t, Math.random());
  src.stop(t + 0.1);
}

// Parfüm sıkma: SPRAY zaman çizelgesine göre (ağır çekimde de uyumlu).
export function spray() {
  if (!live()) return;
  const s = SPRAY_SLOW;
  tick(0.05 * s, 1800, 0.06);
  const t = ctx.currentTime + SPRAY.emit * s;
  const dur = SPRAY.emitDur * s;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3200;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.13, t + 0.03);
  g.gain.setValueAtTime(0.13, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hp).connect(g).connect(out(0.2));
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
  tick(SPRAY.back * s, 1500, 0.07);
}

// Ortam tabakası: iki yumuşak ton (kök ve beşli), alçak geçiren süzgeç yavaşça nefes alır.
function startPad() {
  if (pad || !ctx || content.ambient === false) return;
  const g = ctx.createGain();
  g.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  lp.Q.value = 0.4;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lg = ctx.createGain();
  lg.gain.value = 180;
  lfo.connect(lg).connect(lp.frequency);
  lfo.start();
  const oscs = [0.5, 0.75, 0.502].map((r) => {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = noteOf(useStore.getState().active ?? 0) * r;
    o.connect(lp);
    o.start();
    return [o, r];
  });
  lp.connect(g).connect(master);
  g.gain.setTargetAtTime(0.022, ctx.currentTime, 2.5);
  pad = { oscs, g };
}

function glidePad(i) {
  if (!pad) return;
  const t = ctx.currentTime;
  pad.oscs.forEach(([o, r]) => o.frequency.setTargetAtTime(noteOf(i) * r, t, 0.6));
}

// Sahneyi izler: aktif ürün değişince geçiş sesi; şişe yerine oturunca (kaydırma durunca ya da tıklamayla
// uçan şişe kaideye inince) o ürünün tınısı; sprey başlayınca sprey sesi.
let started = false;
export function startSound() {
  if (!ENABLED || typeof window === "undefined" || started) return;
  started = true;
  // Ses düğmesinin kendi tıklaması sayılmaz (yoksa aynı tıklama önce açar, düğme hemen kapatır).
  const gesture = (e) => {
    if (!e.target?.closest?.(".sound-btn")) unlock();
  };
  ["pointerdown", "keydown", "touchend"].forEach((e) => window.addEventListener(e, gesture, { passive: true }));
  document.addEventListener("visibilitychange", () => ctx && setMaster(!document.hidden && pref() && ctx.state === "running"));
  let active = useStore.getState().active;
  let pending = -1;
  let land = sceneState.landAt;
  let sprayT = sceneState.spray.t0;
  let lastWhoosh = 0;
  const loop = () => {
    requestAnimationFrame(loop);
    const st = useStore.getState();
    if (!st.loaded) return;
    if (SCENE && st.active !== active) {
      const now = performance.now();
      const dir = Math.sign(st.order.indexOf(st.active) - st.order.indexOf(active)) || 1;
      if (now - lastWhoosh > 260) whoosh(dir, st.swapping ? 1.25 : 1);
      lastWhoosh = now;
      active = st.active;
      pending = active;
    }
    if (sceneState.landAt !== land) {
      land = sceneState.landAt;
      if (land && SCENE) chime(active, 1.1);
      pending = -1;
    } else if (SCENE && pending >= 0 && !st.swapping && Math.abs(scrollState.p - Math.round(scrollState.p)) < 0.012 && Math.abs(scrollState.velocity) < 0.4) {
      if (st.order[slotIndex(scrollState.p)] === pending) chime(pending);
      pending = -1;
    }
    if (sceneState.spray.t0 !== sprayT) {
      sprayT = sceneState.spray.t0;
      if (sceneState.spray.flavor >= 0) spray();
    }
  };
  requestAnimationFrame(loop);
  // Tanı (?sounddebug): ses durumunu konsoldan okumak için.
  if (new URLSearchParams(window.location.search).has("sounddebug"))
    window.__sound = () => ({ unlocked: soundState.unlocked, state: ctx?.state, pref: pref(), hidden: document.hidden, active: useStore.getState().active, loaded: useStore.getState().loaded, p: scrollState.p });
}
