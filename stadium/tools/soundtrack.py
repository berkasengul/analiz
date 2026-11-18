"""Original, royalty-free soundtrack + SFX for the RAMS Park Short, synthesised with numpy.

Usage: python3 tools/soundtrack.py <events.json> <out.wav> [duration]
events.json comes from tools/record.mjs (click / key / flip / whoosh / reveal timestamps).
"""
import json, sys, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(1905)
events = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else []
OUT = sys.argv[2] if len(sys.argv) > 2 else 'soundtrack.wav'
DUR = float(sys.argv[3]) if len(sys.argv) > 3 else 41.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)

BPM = 124
BEAT = 60 / BPM
DROP1, BREAK, DROP2, OUTRO = 1.3, 24.4, 27.8, 35.0


def t_arr(n):
    return np.arange(n) / SR


def add(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    l = gain * np.sqrt(0.5 * (1 - pan)); r = gain * np.sqrt(0.5 * (1 + pan))
    L[i:i + len(sig)] += sig * l
    R[i:i + len(sig)] += sig * r


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / np.sqrt(1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def noise(n):
    return rng.standard_normal(n)


def env(n, a=0.002, d=0.2):
    t = t_arr(n)
    return np.minimum(1, t / a) * np.exp(-t / d)


# ---------------- instruments ----------------
def kick():
    n = int(0.45 * SR); t = t_arr(n)
    f = 45 + 95 * np.exp(-t / 0.045)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.28) * 1.0 + 0.25 * noise(n) * np.exp(-t / 0.004)


def clap():
    n = int(0.3 * SR); t = t_arr(n)
    x = fft_filter(noise(n), lo=900, hi=6000)
    e = np.exp(-t / 0.09) * (1 + 0.6 * (np.exp(-((t - 0.012) / 0.003) ** 2) + np.exp(-((t - 0.024) / 0.003) ** 2)))
    return x * e * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05) * 0.25


def hat(open_=False):
    n = int((0.22 if open_ else 0.06) * SR); t = t_arr(n)
    return fft_filter(noise(n), lo=7000) * np.exp(-t / (0.08 if open_ else 0.018)) * 0.5


def saw(freq, t, detune=0.0):
    ph = (freq * (1 + detune)) * t
    return 2 * (ph - np.floor(ph + 0.5))


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# progression (Am - F - C - G), one chord per bar
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOTS = [45, 41, 48, 43]
BAR = 4 * BEAT


def pad(chord, dur, bright=1.0):
    n = int(dur * SR); t = t_arr(n)
    x = np.zeros(n)
    for m in chord:
        for d in (-0.006, 0, 0.007):
            x += saw(note(m + 12), t, d) * 0.12
    x = fft_filter(x, hi=1400 + 2600 * bright)
    a = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3)
    return x * np.clip(a, 0, 1)


def bass(m, dur):
    n = int(dur * SR); t = t_arr(n)
    f = note(m - 12)
    x = np.sin(2 * np.pi * f * t) * 0.8 + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.15 * saw(f, t)
    a = np.minimum(1, t / 0.01) * np.minimum(1, np.maximum(0, (dur - t) / 0.05))
    return fft_filter(x, hi=900) * a


def pluck(m, dur=0.22):
    n = int(dur * SR); t = t_arr(n)
    f = note(m + 24)
    x = (np.sign(np.sin(2 * np.pi * f * t)) * 0.4 + np.sin(2 * np.pi * f * t)) * np.exp(-t / 0.07)
    return fft_filter(x, hi=5000) * 0.22


def riser(dur):
    n = int(dur * SR); t = t_arr(n)
    x = noise(n); out = np.zeros(n); seg = int(0.05 * SR)
    for i in range(0, n, seg):
        k = i / n
        out[i:i + seg] = fft_filter(x[i:i + seg], lo=300 + 5000 * k, hi=1500 + 9000 * k)
    return out * (t / dur) ** 2 * 0.5


def impact():
    n = int(2.2 * SR); t = t_arr(n)
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-t / 0.08)) * t) * np.exp(-t / 0.6)
    shimmer = fft_filter(noise(n), lo=4000) * np.exp(-t / 0.9) * 0.18
    return boom * 0.9 + shimmer


def whoosh(dur=0.9):
    n = int(dur * SR); t = t_arr(n)
    x = noise(n); out = np.zeros(n); seg = int(0.03 * SR)
    for i in range(0, n, seg):
        k = i / n; c = 400 + 3800 * np.sin(np.pi * k)
        out[i:i + seg] = fft_filter(x[i:i + seg], lo=c * 0.5, hi=c * 1.6)
    return out * np.sin(np.pi * t / dur) ** 2 * 0.55


def tick(f=3200, d=0.012, g=0.5):
    n = int(0.05 * SR); t = t_arr(n)
    return (np.sin(2 * np.pi * f * t) * 0.6 + fft_filter(noise(n), lo=2000) * 0.5) * np.exp(-t / d) * g


def flip():
    n = int(0.55 * SR); t = t_arr(n)
    x = fft_filter(noise(n), lo=1500, hi=9000)
    e = np.exp(-((t - 0.12) / 0.06) ** 2) + 0.7 * np.exp(-((t - 0.32) / 0.05) ** 2)
    return x * e * 0.5


def crowd(dur):
    n = int(dur * SR); t = t_arr(n)
    x = fft_filter(noise(n), lo=200, hi=2200)
    mod = 0.6 + 0.25 * np.sin(2 * np.pi * 0.17 * t) + 0.15 * np.sin(2 * np.pi * 0.41 * t + 1)
    return x * mod * 0.07


# ---------------- arrangement ----------------
def drum_section(a, b, hats=True):
    t = a
    beat_i = 0
    while t < b - 1e-6:
        add(kick(), t, 0.95)
        if beat_i % 2 == 1:
            add(clap(), t, 0.55, 0.05)
        if hats:
            add(hat(), t + BEAT / 2, 0.35, 0.3)
            add(hat(), t + BEAT / 4, 0.16, -0.3); add(hat(), t + 3 * BEAT / 4, 0.16, -0.3)
            if beat_i % 4 == 3:
                add(hat(True), t + BEAT / 2, 0.22, 0.2)
        t += BEAT; beat_i += 1


def music_section(a, b, drums=True, bright=1.0, arp=True):
    t = a; bar = 0
    while t < b - 1e-6:
        dur = min(BAR, b - t)
        c = CHORDS[bar % 4]
        add(pad(c, dur, bright), t, 0.5, -0.15); add(pad(c, dur, bright), t + 0.011, 0.5, 0.15)
        if drums:
            for k in range(4):  # off-beat bass (sidechain feel)
                if t + k * BEAT + BEAT / 2 < b:
                    add(bass(ROOTS[bar % 4], BEAT / 2 * 0.9), t + k * BEAT + BEAT / 2, 0.55)
        if arp:
            seq = [c[0], c[1], c[2], c[1] + 12, c[2], c[1], c[0] + 12, c[2]]
            for k in range(16):
                tt = t + k * BEAT / 4
                if tt < b:
                    add(pluck(seq[k % 8]), tt, 0.5, 0.35 if k % 2 else -0.35)
        t += BAR; bar += 1


# intro: pad + riser into the reveal
music_section(0, DROP1, drums=False, bright=0.3, arp=False)
add(riser(DROP1 + 0.1), 0.0, 0.6)
add(impact(), DROP1, 0.9)
# drop 1
drum_section(DROP1, BREAK)
music_section(DROP1, BREAK)
# breakdown while typing BİLET
music_section(BREAK, DROP2, drums=False, bright=0.25, arp=False)
add(riser(DROP2 - BREAK), BREAK, 0.7)
add(impact(), DROP2, 0.8)
# drop 2 (VIP) + outro
drum_section(DROP2, OUTRO + 4 * BEAT)
music_section(DROP2, DUR)
drum_section(OUTRO + 4 * BEAT, DUR - 1.0, hats=False)

# crowd ambience all through, louder at the drops
cr = crowd(DUR)
swell = np.ones(N) * 0.7
for at in (DROP1, DROP2):
    i = int(at * SR); n = int(3 * SR)
    swell[i:i + n] += 1.2 * np.exp(-np.arange(min(n, N - i)) / SR / 1.2)
L += cr * swell; R += np.roll(cr, 331) * swell

# SFX from the recorder's events
for e in events:
    k, at = e['type'], e['t']
    if k == 'click': add(tick(2600, 0.01, 0.6), at, 1.0)
    elif k == 'key': add(tick(1800 + rng.integers(0, 500), 0.02, 0.7), at, 1.0)
    elif k == 'flip': add(flip(), at, 1.0)
    elif k == 'whoosh': add(whoosh(1.0), at, 0.9)
    elif k == 'reveal': pass

# master: fade, soft clip, normalise
fade = np.ones(N); fn = int(1.2 * SR); fade[-fn:] = np.linspace(1, 0, fn); fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
mix = np.stack([L, R], 1) * fade[:, None]
mix = np.tanh(mix * 0.9)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.89
pcm = (mix * 32767).astype('<i2')
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', OUT, f'{DUR:.1f}s')
