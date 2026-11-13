# 3D scroll siteleri için eklenti araştırması (06.10.2026)

Motor: React 18 + React Three Fiber 8 + three 0.163 + drei + Lenis + framer-motion (hope-demo/).
Kaynaklar: GitHub (pmndrs ekosistemi, MengTo/threeui), Codrops, three.js forumu, Lenis ve postprocessing belgeleri.
Türkçe kaynaklarda bu konuda derli toplu bir rehber bulunamadı.

## Eklenenler

| Eklenti | Ne yapıyor | Nasıl açılır |
|---|---|---|
| **@react-three/postprocessing 2.19 + postprocessing 6.36** (MIT, pmndrs) | Parlama (bloom), vinyet, film greni, ACES renk | `theme.fx: true` ya da `{bloom, threshold, vignette, grain}`; telefonda ve kare hızı düşünce kapalı (Scene.jsx) |
| **ThreeUI "Woven Cloth"** (MIT, MengTo/threeui) | Markanın adı dokunmuş, fizikle dalgalanan ipek bant | `theme.cloth` (README "Marka kumaşı") |

postprocessing 6.37+ three 0.168 ister; bu yüzden 6.36.7'ye sabitlendi (package.json → overrides).

## Zaten var (eklemeye gerek yok)

- **Lenis** (yumuşak kaydırma), **drei** (Environment, PerformanceMonitor, Preload), **framer-motion**.
- Cihaza göre kalite: drei `PerformanceMonitor` piksel oranını düşürüyor; artık efektleri de kapatıyor.

## Değerlendirilip eklenmeyenler

- **GSAP + ScrollTrigger / SplitText**: Kendi kaydırma sistemimiz (scroll.js) ve framer-motion aynı işi görüyor; ikinci bir
  animasyon motoru paket boyutunu büyütür, çakışma riski var.
- **Theatre.js**: Kamera anahtar kareleri için güçlü ama ağır; elle ayarlı kamera düzenimiz yeterli.
- **r3f-scroll-rig** (14islands): DOM ile 3B nesneyi eşler; bizim mimari tek tuval + kendi kaydırma durumu, gerek yok.
- **MeshTransmissionMaterial** (drei'de var): Gerçek kırılan cam. Fotoğraftan yapılan şişelerimiz doku tabanlı; her şişe
  ek bir çizim geçişi ister, telefonda ağır. İleride yalnızca masaüstünde, şeffaf camlı markalarda denenebilir.
- **r3f-perf**: Yalnızca geliştirme aracı.
- **ThreeUI'nin diğer bileşenleri**: Çoğu teknoloji/SaaS sayfa şablonu; CDN'den gsap/tailwind çekiyorlar, parfüme uymuyor.
