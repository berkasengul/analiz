# UnBe. — 3B kaydırmalı parfüm vitrini (AGENTS.md)

## Amaç
"UnBe." markasının No Collection'ı (6 Eau de Parfum) için tek sayfalık, sinematik, 3B kaydırmalı bir
vitrin sitesi. Sayfanın arkasında TEK, sabit bir WebGL sahnesi vardır; HTML bölümleri bunun üstünde
kayar. Aynı 3B şişe bölümden bölüme "uçarak" geçer (paylaşılan nesne): bu sitenin imzası budur.
Her kokunun kendi canlı rengi var; sahne, ışık ve arayüz vurguları o renge yumuşakça geçer.

## Teknoloji (değiştirme)
- Vite 5 + React 18 + TypeScript
- three 0.163, @react-three/fiber 8, @react-three/drei 9, @react-three/postprocessing 2
- lenis (yumuşak kaydırma), zustand (durum), framer-motion (HTML geçişleri)
- Fontlar (Google Fonts, latin-ext): "Syne" 500–800 (başlıklar, ürün adları), "Jost" 300–500 (metin, etiket)
- Komutlar: `npm run dev`, `npm run build`, `npm run preview`, `npm run images` (görsel hazırlama),
  `npm run shots` (Playwright ekran görüntüleri). Build uyarısız/hatasız geçmeli.

## Klasör yapısı
src/
  data/products.ts        (aşağıdaki veri, tipli)
  data/copy.ts            (TR/EN arayüz metinleri)
  store.ts                (zustand: active, lang, cart, spray, finderResult, section)
  scroll/                 (Lenis kurulumu, bölüm ilerlemeleri: progress(sectionId) 0..1, sayfalı kaydırma)
  three/Scene.tsx         (tek Canvas, position: fixed, z-index 0, tüm bölümlerin arkasında)
  three/Backdrop.tsx      (renkli sisli stüdyo arka planı, shader)
  three/Floor.tsx, Pedestal.tsx, Dust.tsx, Effects.tsx
  three/Bottle.tsx        (fotoğraftan 3B şişe: kapak + gövde)
  three/BottleRig.tsx     (şişelerin bölüme göre poz koreografisi)
  three/Spray.tsx         (buğu parçacıkları)
  ui/Header.tsx, Loader.tsx, sections/*.tsx, Cart.tsx
  audio/sound.ts          (Web Audio: tık, fısss)
scripts/prepare-images.mjs, scripts/shots.mjs
public/brand/logo.png, public/products/<id>.png

## Marka
- Ad: "UnBe." · koleksiyon: "No Collection" · slogan TR "Duruşunu seç." EN "Choose your stance."
- Motto: "UNBE is not just a fragrance brand. It's a mindset."
- Logo: https://unbeperfumes.com/cdn/shop/files/Unbe_Logo.png (beyaz, saydam; "Be." kısmı beyaz
  kutunun içinden oyulmuş). public/brand/logo.png olarak indir, saydam kenarları kırp.
- Vurgu rengi (genel): #f0583a. Metin rengi: #f4ece4. Koyu zemin: #0b0b0d.
- İletişim: info@unbeperfumes.com · 0553 978 44 74 · Instagram @unbeperfumes ·
  Yeniköy Mah. Köybaşı Cad. No:122/9 Sarıyer / İstanbul
- Mağaza: Shopify, https://unbeperfumes.com. Sepete ekle → https://unbeperfumes.com/cart/<variantId>:<adet>

## Ürün verisi (src/data/products.ts) — aynen kullan
color: sahne rengi (canlı), tint: açık ton (vurgu, yazı parıltısı), dark: kenar/gölge tonu.
image: beyaz zeminli, yalnız şişenin olduğu fotoğraf (ön).
Veri `src/data/products.ts` içinde birebir yer alır (6 koku: no-tears, no-excuse, no-drama,
no-regrets, no-filter, no-rules).

Ritüel sloganları (kampanya görsellerinden):
- no-tears: TR "Güç, gözyaşlarının bittiği yerde başlar." EN "Strength begins where the tears end."
- no-excuse: "Sonuçlar bahanelerden yüksek sesle konuşur." / "Results speak louder than excuses."
- no-drama: "Varlık, her tartışmadan daha yüksek sesle konuşur." / "Presence is louder than any argument."
- no-regrets: "Her seçim hikâyenin bir parçası olur." / "Every choice becomes part of the story."
- no-filter: "Gerçek sen, en nadir olanısın." / "The real you is the rarest flex."
- no-rules: "Yolu sen yarat. Takip etme." / "Create the path. Don't follow it."

## Görsel hazırlama (scripts/prepare-images.mjs, `npm run images`)
- Her ürünün `image` adresini indir; arka planı sil (@imgly/background-removal-node), saydam
  kenarları kırp, 1400 px yüksekliğe ölçekle, public/products/<id>.png kaydet.
- Aynı betik her şişe için `public/products/<id>.json` üretsin: {neck, rows[], edgeColor}
  - rows: yukarıdan aşağı 256 satırda, alfa > 128 olan genişliğin yarısı (0..0.5, görsel genişliğine oranla)
  - neck: kapağın bittiği satır (yukarıdan, 0..1): satır genişliğinin ilk kez %60'tan fazla
    sıçradığı yer (küre kapak → gövde omzu). Bulunamazsa 0.33.
  - edgeColor: gövdenin sol/sağ kenarından 6 px içerideki piksellerin ortalama rengi

## 3B şişe (three/Bottle.tsx) — kalite kuralı: önden fotoğraf kadar net
- Kapak (neck üstü): rows'tan LatheGeometry (48 dilim). Ön yarıya fotoğraf izdüşer (UV: x = 0.5 + sinθ·r).
- Gövde (neck altı): rows'tan sol/sağ dış çizgi → Shape → ExtrudeGeometry, derinlik = gövde
  genişliği × 0.42, bevelSize 0.04, bevelThickness 0.05, curveSegments 4. Ön yüz fotoğraf, arka yüz
  fotoğrafın yatay aynası, yan yüzler edgeColor düz renk. Kenar köşeleri mergeVertices + yumuşak normal.
- Malzeme: MeshPhysicalMaterial { map (sRGB, anisotropy 8), roughness 0.28, clearcoat 1,
  clearcoatRoughness 0.12, envMapIntensity 1.0, transmission 0 }. Buzlu cam hissi için gövdede
  hafif fresnel kenar parlaması (onBeforeCompile ile rim += pow(1-dot(N,V),3)*0.25*tint).
- Kapak siyah küreyse (no-excuse, no-rules) roughness 0.18 parlak siyah; beyazsa saten beyaz.
- Boyut: şişe boyu dünya biriminde 3.3; ölçek bölüme göre BottleRig'den gelir.

## Sahne (three/Scene.tsx)
- Canvas: fixed, tam ekran, dpr [1, 1.75] (telefonda [1, 1.5]), ACESFilmic, antialias.
- Kamera: perspektif, fov 32, konum (0, 1.2, 14), hedef (0, 0.6, 0). Fare ile çok hafif paralaks (±0.3).
- Backdrop (tam ekran düzlem, shader): ürünün `color`'ıyla boyanan sisli stüdyo.
  - Ortada (şişenin arkasında) yumuşak, parlak bir hale: mix(color, beyaz, 0.55).
  - Kenarlara ve üste doğru koyulaşma: mix(color, dark, 0.75); vinyet.
  - Ekranın ~%78'i hizasında yatay, ince, parlak bir ufuk ışığı bandı.
  - Çok hafif, yavaş akan fbm sis (0.03 hız). Renk geçişi: aktif ürün değişince 1.2 sn (üstel yaklaşım).
- Floor: ufkun altında cilalı zemin, MeshReflectorMaterial (blur [300,80], mixStrength 0.7, rengi dark).
- Pedestal: krem-beyaz (#f3ece2) iki katlı alçak silindir (üst r 1.55 h 0.22, alt r 1.7 h 0.18), her
  katın üst kenarında 0.012 kalınlıkta halka, halkanın rengi aktif ürünün `color`'ı; en altta ince krom halka.
- Dust: 260 nokta, çok küçük, beyaz, yavaşça yükselir.
- Işık: üstten yumuşak beyaz spot (açı 0.45, penumbra 1), iki yandan tint renginde rim ışık, environment
  "studio" (drei Environment preset="studio", intensity 0.6).
- Effects: Bloom (0.18, threshold 0.9), Vignette (0.35), hafif ChromaticAberration YOK.

## Kaydırma ve 3B koreografi (scroll/ + three/BottleRig.tsx)
- Lenis (lerp 0.09). Her bölümün ilerlemesi progress(id) ∈ [0,1] (bölüm üstü ekranın üstüne geldiğinde 0,
  bölüm altı ekranın altına geldiğinde 1). Sticky (pinned) bölümler: içerik `position: sticky; top: 0;
  height: 100vh` bir kapsayıcıda, bölüm yüksekliği aşağıda.
- Şişe pozları her karede hedef poza üstel yaklaşımla gider (k = 6/sn), gerçek zamana bağlı.
- Bölümler arası geçişte şişe bir önceki bölümün son pozundan sonrakinin ilk pozuna uçar
  (pozlar progress ile karıştırılır, ease-in-out).

## Bölümler (sırayla, birebir)

### 0. Yükleme ekranı
Siyah zemin, ortada logo (yükseklik 44 px), altında 160 px ince ilerleme çizgisi (#f0583a), altında
"No Collection" (Jost 11 px, harf aralığı 0.3em). Görseller yüklenince 0.8 sn'de söner.

### 1. Header (sabit, 72 px)
Solda logo (32 px). Ortada (Jost 12 px, harf aralığı 0.3em, büyük harf): "KOKULAR ˅" (açılır: 6 koku
listesi), "KOKU BULUCU", "UNBE. HAKKINDA", "İLETİŞİM". Sağda arama ikonu, "TR | EN" (aktif dil vurgu
renginde), sepet ikonu (adet rozeti), "MENÜ" + iki çizgi. Altında %12 beyaz ince çizgi; zemin üstten
aşağı koyudan saydama geçiş. Kaydırınca hafif bulanık cam (backdrop-filter: blur(12px)).

### 2. #flavors — Ana akış (pinned, yükseklik 6 × 100vh)
- Tek tekerlek / tek swipe = bir sonraki koku (sayfalı). Geçiş 1.4 sn ease-in-out; geçiş sürerken gelen
  kaydırmalar yok sayılır (wheel kilidi 1.35 sn).
- 3B: aktif şişe ortada kaidede (ölçek 1, y kaide üstü). Önceki şişe solda (x −5.2, z −2.5, ölçek 0.7),
  sonraki sağda (x +5.2, z −2.5, ölçek 0.7), kaidesiz, hafif karartılmış (renk × 0.75). Geçerken şişe
  yay üzerinde kayar, ortadaki hafifçe kalkıp (0.35) yeni kaideye iner. Boşta ±1° / 10 sn salınım.
- Sol blok (sol 78 px, dikey ortanın biraz altı):
  - "01" (Syne 60 px, tint rengi) + 40 px çizgi + "06" (Jost 11 px, %50 opak)
  - "● ODUNSU · AMBERİMSİ · 100 ML" (Jost 11 px, harf aralığı 0.25em; nokta #f0583a)
  - Ad: "NO TEARS" (Syne 84 px, 600, harf aralığı 0.02em, #f4ece4, iki satıra kırılabilir)
  - Duruş: "Yumuşak — Işıltılı — Dayanıklı" (Jost 22 px, italik değil, %90 opak)
  - Düğmeler: "KOKUYU KEŞFET →" (koyu yarı saydam zemin, 1 px açık çerçeve) ve "PARFÜMÜ SIK"
    (solda küçük sprey ikonu, 1 px vurgu renginde çerçeve). Jost 13 px, harf aralığı 0.2em, 44 px yükseklik.
- Sağ blok (sağ 82 px): "NOTALAR" (Jost 10 px, vurgu rengi) ve 5 nota alt alta, sağa yaslı
  (Jost 20 px, italik), sağında 1 px dikey çizgi.
- Alt: solda 6 ilerleme çizgisi (her biri 70 px, aktif olan ürünün color'ında), sağda
  "KEŞFETMEK İÇİN KAYDIR".
- Ürün değişince metinler 0.6 sn'de aşağıdan yukarı kayarak (opacity + translateY 24px) değişir.

### 3. #ritual — "02 — RİTÜEL" (pinned, 3 × 100vh; 3 adım: no-tears, no-drama, no-rules)
- Her adımda arka plan o kokunun rengine geçer. Solda dev slogan (Syne 64 px, büyük harf, 4 satıra
  kadar), altında koku hikâyesinin ilk cümlesi (Jost 16 px), "● BU ADIMDA: NO TEARS" (11 px).
- Sağda (ekranın ~%62'si) şişe kaidesiz, 18° eğik, yavaşça kendi ekseninde döner (adım içinde 0 → 40°).
- Alt şerit: 3 adım listesi ("01 Güç, gözyaşlarının… 02 Varlık… 03 Yolu sen yarat…"), aktif olan beyaz.
- En altta, ekran genişliğinde, kontur (outline) yazıyla dev duruş metni: "Yumuşak — Işıltılı —
  Dayanıklı" (Syne 120 px, -webkit-text-stroke 1px rgba(255,255,255,.18), dolgusuz), adımla yatay kayar.

### 4. #pyramid — "NOTA PİRAMİDİ" (pinned, 4.8 × 100vh)
- Üstte 6 koku sekmesi (küçük çerçeveli düğmeler, aktif olan vurgu renginde); sekme değişince şişe değişir.
- Solda büyük başlık: koku adı (Syne 72 px) ve "Kaydırmaya devam edin: şişe katman katman açılsın."
- 3B: şişe ortada, kaydırdıkça ÜÇ katmana ayrılır (kapak yukarı, gövdenin üst yarısı ortada, alt yarısı
  aşağıda; gövde kesitleri clipping plane ile). Katmanlar arası boşluk 0 → 1.1 birim. Her katmanın
  etrafında ince, parlak bir halka (ürün tint renginde, toplamalı karışım).
- Etiketler katmanların yanında sırayla belirir: ÜST (sağda), KALP (solda), DİP (sağda); her biri:
  küçük başlık (Jost 10 px, vurgu) + notalar (Jost 18 px). Sağ üstte "● ODUNSU · AMBERİMSİ / NO TEARS".
- Bölüm sonunda katmanlar geri birleşir.

### 5. #finder — "KOKU BULUCU · 01 — 03" (100vh)
- Solda kart (yarı saydam koyu, 1 px çerçeve, 32 px iç boşluk): başlık "KOKUNU BUL" (Syne 40 px),
  açıklama "Üç soru. Her kokunun notalarını okuyup seninkini kaideye koyuyoruz.", soru (Syne 26 px) ve
  4 seçenek (A–D, 2×2 ızgara), altta ilerleme çubuğu.
  Sorular ve puanlar (4 koku ailesi: fresh, floral, sweet, warm):
  1) "Hangi dünya seni çekiyor?" A Narenciye ve deniz esintisi {fresh:1} · B Bir buket çiçek {floral:1} ·
     C Tatlı bir şey {sweet:1} · D Odun, baharat ve duman {warm:1}
  2) "Ne zaman süreceksin?" A Güneşli günler {fresh:.6, floral:.4} · B Şehirde akşamlar {sweet:.5, warm:.5} ·
     C Unutulmaz bir gece {warm:.7, sweet:.3} · D Her gün {floral:.5, fresh:.5}
  3) "Sana nasıl hissettirsin?" A Hafif ve özgür {fresh:.6, floral:.4} · B Yumuşak ve sıcacık
     {sweet:.6, floral:.4} · C Cesur ve çekici {warm:.7, sweet:.3} · D Sessizce zarif {floral:.6, warm:.4}
  (EN: "Which world pulls you in?" / "When will you wear it?" / "How should it make you feel?")
- Puanlama: her kokunun piramit notaları ve ailesi küçük harfe çevrilip aile sözlükleriyle sayılır,
  normalize edilir (koku profili). Örnek sözlükler: fresh = bergamot, mandalina, greyfurt, neroli,
  deniz, marin, akuatik, yeşil, kakule, armut, limon · floral = gül, yasemin, portakal çiçeği,
  manolya, müge, süsen, sümbülteber, pudra · sweet = şeftali, liçi, çilek, pamuk şekeri, vanilya, rom,
  çarkıfelek, meyve · warm = misk, paçuli, sedir, sandal, safran, cypriol, kaşmir, ambergris, amber,
  deri, tütsü, benjoin, isli. Cevapların toplam vektörüyle nokta çarpımı en yüksek olan koku sonuç;
  iki alternatif "Bunları da dene" olarak altta gösterilir. Butonlar: "Geri", "Baştan başla".
- 3B: sağda boş kaide ("KOKUN BURAYA İNECEK" yazısı üstünde); sonuçta şişe yukarıdan kaideye iner
  (0.9 sn, hafif zıplama), arka plan sonucun rengine geçer, "Kokuyu keşfet" ve "Sepete ekle" düğmeleri çıkar.

### 6. #all — "TÜM ÜRÜNLER · KOLEKSİYONUN TAMAMI" (normal akış)
- Başlık (Syne 48 px) ve "6 koku: No Collection.", "Kadın · Erkek" filtre sekmeleri.
- 3 sütunlu kart ızgarası (telefonda 1 sütun). Kart: üstte 4:5 görsel alanı — kokunun color'ında sisli
  stüdyo ve kaidede şişe (bu görseller build sırasında sahneden render edilip webp olarak kaydedilir,
  ya da kart içinde küçük bir Canvas YERİNE önceden render edilmiş görsel kullanılır: performans),
  altında "KADIN · 100 ML", ad (Syne 22 px), duruş, notalar (11 px büyük harf), fiyat ve "+" düğmesi.
- Karta gelince görsel 1.04 ölçeklenir, alt kenarda ürün renginde 2 px çizgi belirir.

### 7. #shop — "03 — MAĞAZA · KOKUNU SEÇ" (100vh)
- Solda: başlık (Syne 72 px, iki satır "KOKUNU / SEÇ"), "Duruşunu seç; markanın kendi mağazasında
  güvenle öde.", "KOKU: NO TEARS" ve 6 renk noktası (her kokunun color'ı; seçili olan halkalı),
  fiyat "₺1.999" (Syne 32 px), adet (− 1 +), "SEPETE EKLE" (dolu, vurgu rengi), altında 3 küçük
  avantaj satırı: "✓ Eau de Parfum, uzun süre kalıcı · ✓ Formül İspanya, üretim Türkiye ·
  ✓ Keşif setiyle önce dene".
- 3B: şişe sağda, kaidesiz, yavaş döner; renk noktası seçilince şişe değişir (eskisi yana kayıp çıkar).

### 8. #story — "04 — HİKÂYE" (normal akış, koyu zemin)
- Solda "DURUŞUNU SEÇ." (Syne 56 px), motto (italik 20 px), 3 paragraf (markanın "UnBe. Hakkında"
  metni), altta yuvarlak logo rozeti + "UnBe. · İstanbul", "GÖRÜLDÜĞÜ YERLER: Vogue Türkiye".
- Sağda dikey zaman çizgisi (4 madde, noktalı çizgi): Duruş (Önce ruh hâli ve duruş) · Formül
  (İspanya'da formüle edilir) · Üretim (Türkiye'de üretilir) · No Collection (Altı koku, altı duruş);
  altında 3 istatistik kutusu: "6 koku" · "100 ml Eau de Parfum" · "4 + 2 kadın ve erkek".

### 9. #faq — "06 — SSS · MERAK EDİLENLER" (akordeon)
Kokular ne kadar kalıcı? → Tüm UNBE kokuları Eau de Parfum ve uzun süre kalıcıdır. ·
Kokular nerede üretiliyor? → Formüller İspanya'da hazırlanıyor, üretim Türkiye'de. ·
Önce deneyebilir miyim? → Keşif setleriyle (kadın 4 × 2 ml, erkek 2 × 2 ml, tümü 6 × 2 ml) deneyebilirsin.

### 10. #contact — "İLETİŞİM · BİZE YAZ"
Solda form (Ad soyad, E-posta, Mesaj; alt çizgili alanlar; "MESAJI GÖNDER" dolu vurgu düğmesi),
sağda "BÜLTEN · Yeni duruşlar önce burada." e-posta alanı + "KATIL". Altta 4 sütun: E-posta, Telefon,
Instagram, Adres. Form gönderimi: mailto: ile.

### 11. Footer
Kayan şerit (marquee, 40 sn): "UnBe. · No Tears · No Excuse · No Drama · No Regrets · No Filter ·
No Rules · Mindset before fragrance". Altında "UNBE. · DURUŞUNU SEÇ." ve bağlantılar.

## "Parfümü sık" (Spray)
Zaman çizelgesi (sn): kapak kalkar 0–0.55 · başlığa basılır 0.8 · buğu 0.85–1.6 · kapak kapanır 3.1–3.8.
- Kapak (küre) yukarı +0.5 ve yana +0.25 kalkar, 8° eğilir, havada hafifçe salınır, geri oturur.
- Kapağın altında sprey başlığı: gümüş yaka (silindir r 0.16 h 0.12) + aktüatör (r 0.12 h 0.14),
  0.8'de 0.04 aşağı basılır.
- Buğu: 1500 parçacık (telefonda 700), Points + ShaderMaterial, hareket tamamen shader'da
  (u_t0, u_origin, u_dir): %73 ince sis (hızlı, 22° koni), %20 parlayan damlacık (büyük, parlak),
  %7 yavaş açılan bulut (büyür, söner). Yön ekrana doğru + hafif yukarı. Renk: beyazdan tint'e.
- Buğuyla birlikte 5 nota ekranda sırayla (0.15 sn arayla) süzülerek belirir, 3 sn sonra kaybolur.
- Ses (Web Audio, dosya yok): kapak kalkınca "tık" (bandpass 1800 Hz gürültü, 70 ms), buğu "fısss"
  (highpass 3200 Hz gürültü, 0.75 sn), kapanınca "tık". İlk kullanıcı etkileşiminde AudioContext açılır.

## Sepet
Sağdan açılan çekmece: ürünler, adet, ara toplam; "Ödemeye geç" → https://unbeperfumes.com/cart/
<variantId>:<adet>,<variantId>:<adet>. Sepet localStorage'da tutulur.

## Dil
TR varsayılan, EN düğmesiyle tüm metinler (ürün aile/duruş/piramit dahil) değişir; <html lang>.

## Telefon (390 × 844)
- #flavors: sayaç solda üstte, şişe ortada (ölçek 0.8), ad/duruş/düğmeler şişenin altında ortalı,
  notalar gizli, komşu şişeler yarısı ekran dışında.
- #ritual: slogan üstte (Syne 36 px), şişe altta. #pyramid: sekmeler yatay kaydırmalı.
- Swipe: dikey kaydırma hareketi bir ürün ilerletir (eşik 40 px).
- 60 fps hedefi: dpr ≤ 1.5, parçacık 700, reflector çözünürlüğü 512.

## Performans ve kalite
- İlk anlamlı görüntü < 3 sn (4G): görseller webp/png ≤ 400 KB, kod bölme (three ayrı chunk).
- Konsolda hata/uyarı yok. Tüm etkileşimler klavyeyle kullanılabilir; prefers-reduced-motion'da
  geçişler anlık, parçacıklar kapalı.
- Uydurma bilgi yazma: yalnız bu dosyadaki metinleri kullan.

## Aşamalar (her aşama sonunda: `npm run build` temiz + `npm run shots` + commit)
M1 İskelet: Vite+React+TS, Lenis, zustand, Header, Loader, boş bölümler doğru yükseklikte, TR/EN.
   Kabul: sayfa kayıyor, bölüm id'leri ve yükseklikleri doğru, header sabit.
M2 Görseller: scripts/prepare-images.mjs; 6 png + 6 json üretildi.
   Kabul: public/products/*.png saydam ve kırpılmış; neck değerleri 0.28–0.42 arasında.
M3 3B sahne + şişe: Scene, Backdrop, Floor, Pedestal, Dust, Effects, Bottle.
   Kabul: no-tears şişesi kaidede, önden fotoğraf kadar net; arka plan turkuaz sis.
M4 #flavors akışı: sayfalı kaydırma, komşular, renk geçişi, sol/sağ bloklar, ilerleme çizgileri.
   Kabul: 6 tekerlek hareketiyle 6 koku sırayla gelir; her birinde arka plan kendi renginde.
M5 BottleRig koreografisi: #ritual, #pyramid (katmanlara ayrılma), #finder (kaideye iniş), #shop.
   Kabul: şişe bölümler arasında kopmadan uçar; piramitte 3 katman ve etiketler.
M6 Spray + ses + sepet çekmecesi + Shopify sepet bağlantısı.
M7 #all kart ızgarası (önceden render edilmiş kart görselleri), #story, #faq, #contact, footer.
M8 Telefon, erişilebilirlik, performans, son kontrol: scripts/shots.mjs 1440×810 ve 390×844'te her
   bölümün ekran görüntüsünü shots/ klasörüne alır; hepsini gözden geçir, taşan/çakışan yazı olmasın.
