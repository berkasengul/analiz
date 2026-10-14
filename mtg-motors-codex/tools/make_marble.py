# Kesintisiz (tileable) prosedürel mermer dokusu: Diffuse + Rough + nor_gl (webp).
# Periyodik FFT gürültüsü + alan bükme (domain warp) ile ince damarlar. Kullanım: python3 tools/make_marble.py
import numpy as np, os
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'textures')
N = 2048
rng = np.random.default_rng(11)
fy = np.fft.fftfreq(N)[:, None]; fx = np.fft.fftfreq(N)[None, :]
F = np.sqrt(fx ** 2 + fy ** 2); F[0, 0] = 1
def noise(beta, lo=2):                       # 1/f^beta periyodik gürültü (kenarlar birleşir)
    ph = np.exp(2j * np.pi * rng.random((N, N)))
    amp = F ** (-beta); amp[F < lo / N] = 0
    n = np.real(np.fft.ifft2(amp * ph)); n -= n.mean(); return n / n.std()
yy, xx = np.mgrid[0:N, 0:N] / N
def veins(freq, warp, sharp, ang, w1, w2, w3):
    t = (xx * np.cos(ang) + yy * np.sin(ang)) * freq        # periyodik olması için freq tam sayı
    ph = 2 * np.pi * t + warp * (1.0 * w1 + .45 * w2) + .25 * w3
    return np.exp(-np.abs(np.sin(ph)) * sharp)
w1, w2, w3, base, fine = noise(3.2), noise(2.6), noise(2.0), noise(1.8), noise(.9)
def marble(name, c_base, c_base2, c_vein, k_vein, k_fine):
    # ana damarlar: çapraz, uzun ve akışkan (yumuşak bükme) + ince ikincil damarlar (farklı açı, yer yer)
    v1 = veins(2, 1.25, 34, .62, w1, w2, w3)
    v2 = veins(3, 1.0, 60, 1.05, w2, w1, w3) * np.clip(base * .8 + .2, 0, 1)
    v3 = veins(5, .8, 90, .35, w3, w1, w2) * np.clip(-base * .7, 0, 1)
    v = np.clip(.8 * v1 + .5 * v2 + .35 * v3, 0, 1)
    b = np.clip(.5 + .22 * base, 0, 1)[..., None]
    col = np.array(c_base) * (1 - b) + np.array(c_base2) * b
    col = col * (1 - (v * k_vein)[..., None]) + np.array(c_vein) * (v * k_vein)[..., None]
    col *= (1 + .035 * fine)[..., None]                    # ince kristal dokusu
    out = os.path.join(ROOT, name); os.makedirs(out, exist_ok=True)
    srgb = np.clip(col, 0, 1) ** (1 / 2.2)
    Image.fromarray((srgb * 255).astype(np.uint8)).save(os.path.join(out, 'Diffuse.webp'), quality=90)
    rough = np.clip(.2 + .05 * fine + .08 * v, 0, 1)
    Image.fromarray((np.stack([rough] * 3, -1) * 255).astype(np.uint8)).save(os.path.join(out, 'Rough.webp'), quality=90)
    h = -.6 * v + .15 * fine * k_fine                       # damarlar çok hafif içte (cilalı taşta mikro kabartma)
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 1.2; gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 1.2
    nrm = np.stack([-gx, gy, np.ones_like(h)], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    Image.fromarray(((nrm * .5 + .5) * 255).astype(np.uint8)).save(os.path.join(out, 'nor_gl.webp'), quality=92)
    print('doku', name)
# lineer renk değerleri
marble('graphite_marble', (.012, .0115, .011), (.022, .02, .018), (.28, .25, .22), .32, 1.)     # zemin: koyu antrasit, sıcak gri damar
marble('smoke_marble', (.016, .011, .008), (.034, .024, .016), (.22, .17, .11), .32, 1.)          # marka duvarı: sıcak füme, altın-bej damar
