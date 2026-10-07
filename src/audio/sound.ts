// Web Audio ile dosyasız sesler: kapak "tık", buğu "fısss".
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  const len = ctx.sampleRate * 1;
  noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

/** İlk kullanıcı etkileşiminde AudioContext açılır */
export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function burst(type: BiquadFilterType, freq: number, dur: number, gain: number, at = 0, q = 1, attack = 0.004) {
  const c = ensure();
  if (!c || !noise) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t, Math.random() * 0.2);
  src.stop(t + dur + 0.05);
}

/** bandpass 1800 Hz gürültü, 70 ms */
export const playClick = (at = 0) => burst('bandpass', 1800, 0.07, 0.5, at, 2.5, 0.002);

/** highpass 3200 Hz gürültü, 0.75 sn */
export const playHiss = (at = 0) => burst('highpass', 3200, 0.75, 0.22, at, 0.7, 0.03);

/** Spray zaman çizelgesine göre sesler: tık (0) · fısss (0.85) · tık (3.8) */
export function playSpraySounds() {
  playClick(0.05);
  playHiss(0.85);
  playClick(3.75);
}
