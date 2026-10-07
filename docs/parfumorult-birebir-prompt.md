# Parfümőrült demosu: birebir prompt

## Önce dürüst bir not

Bir prompt yapıştırıp sitenin **piksel piksel aynısının** çıkması mümkün değil. Bunun üç nedeni var:

1. **Site büyük bir motor üzerinde çalışıyor.** Arkasında kendi 3B motorumuz (binlerce satır kod) ve 42 ürün fotoğrafından yapay zekâyla kesilip 3B dokuya çevrilmiş görseller var. Bir prompt bunları taşıyamaz; yapay zekâ kodu her seferinde yeniden ve biraz farklı yazar.
2. **Aynı prompt her seferinde aynı sonucu vermez.** Yapay zekâ aynı prompta iki kez farklı kod yazabilir.
3. **Ürün fotoğrafları promptla gelmiyor.** Fotoğrafların indirilip arka planının silinmesi gerekir.

**Birebir aynı site** için tek yol mevcut dosyalar: `demolar/parfumorult-Netlify.zip` (Netlify Drop'a sürükle, aynı site açılır) ya da repodaki `demolar/parfumorult/` kaynak kodu.

**Video için önerim:** Aşağıdaki prompt, demodaki gerçek değerlerin hepsini içeriyor (renkler, fontlar, metinler, ürünler, fiyatlar, ölçüler, yerleşim). Yapıştırınca **aynı tasarıma çok yakın** bir site çıkar. Videoda "prompt → site" anını göster, karşılaştırma için de orijinal demoyu yan yana aç.

> **Telif uyarısı:** Bu demo gerçek bir mağazanın (parfumorult.hu) ve başka markaların (Xerjoff, Nishane, Mancera…) ürün fotoğraflarını ve adlarını kullanıyor. Bunları herkese açık bir YouTube videosunda izinsiz göstermek telif ve marka sorunu doğurabilir. Ayrıca bu firmaya satış teklifi gidebilir, demoyu herkese açık göstermek ilişkiyi zedeleyebilir. Videoda ya izin al ya da promptun sonundaki "Kurgusal sürüm" notunu kullan.

---

## Prompt

```
Bir 3B parfüm vitrini web sitesi kur. Aşağıdaki tasarımın BİREBİR aynısını yap; değerleri
değiştirme, kendi yorumunu katma. Tüm metinler Macarca, aynen yazıldığı gibi.

### Teknoloji
Vite + React 18 + @react-three/fiber 8 + three 0.163 + @react-three/drei +
@react-three/postprocessing + lenis + zustand. Tek sayfa, html lang="hu".
Fontlar (Google Fonts, latin-ext): başlık ve gövde "Cormorant Garamond" (400-700, italik),
etiketler ve menü "Jost" (300-500).
Vurgu rengi (altın): #d9b46a.

### Marka
- Ad: Parfümőrült · alt başlık: "Signature by Parfümőrült" · slogan:
  "Luxus niche parfümök legjobb illatai! Találjuk meg a Signature illatodat!"
- Logo: krem renkli "Signature by Parfümőrült" yazı logosu (public/brand/logo-cream.png),
  menüde solda, yükseklik ~32 px.
- Sayfa başlığı: "Parfümőrült · Koncepció demó".

### Ürünler (src/products.json): ana sayfa akışında bu 5 parfüm, bu sırayla
Her ürün için: ad, marka (family olarak gösterilir), hacim, fiyat (HUF), kısa italik
tanıtım cümlesi (tagline), 4 nota, sahne rengi (glow) ve açık vurgu rengi (accent).
1. Erba Pura · Xerjoff · 50 ml · 46 900 Ft · "Az Erba Pura egy csábító elixír, amely
   magával ragad és elbűvöl" · notalar: Szicíliai Bergamott, Citrom, Narancs, Mediterrán
   gyümölcsök · glow #4b9aab · accent #cce2e7
2. Hacivat · Nishane · 50 ml · 45 900 Ft · "Tisztelet az elegancia, a kedvesség, a
   hozzáértés és a művészek…" · Bergamot, Ananász, Grapefruit, Jázmin · glow #c69b52 ·
   accent #efe3ce
3. Mansa · Pernoire · 50 ml · 77 000 Ft · "Mansa Musa a Mali Birodalom uralkodója volt a
   13. században" · Fekete ribizli, Rózsabors, Orris gyökér, Oud · glow #3a3440 ·
   accent #c7c6c9
4. Red Tobacco · Mancera · 60 ml · 33 900 Ft · "Egy igazi mindent elsöprő fűszeres és Cubai
   dohányos illat a…" · Sáfrány, Fahéj, Tömjén, Szerecsendió · glow #c63d31 · accent #efc8c5
5. Wardasina · Xerjoff · 100 ml · 95 000 Ft · "Intenzív és titokzatos, a Wardasina egy
   virágos és orientális…" · Gyógynövényes jegyek, Spanyol Sáfrány, Cédrusfa, Pacsuli ·
   glow #c5423c · accent #eecac8
Görseller: https://www.parfumorult.hu/handlers/product.ashx?id=<ID>&i=0
(ID: Erba Pura 7, Hacivat 72, Mansa 420, Red Tobacco 217, Wardasina 116).
Bir derleme betiği (scripts/prepare-images.mjs) görselleri indirsin, arka planı silsin
(@imgly/background-removal-node), kırpıp public/products/<ad>.webp olarak kaydetsin.
"Kosárba" ürünün parfumorult.hu sayfasına gitsin:
https://www.parfumorult.hu/hu/webshop/luxus-parfumok/<kategori>/<ad>?id=<ID>
(Erba Pura, Hacivat, Mansa: unisex-parfumok · Red Tobacco: ferfi-parfumok ·
Wardasina: noi-parfumok).

### Sahne ("ferah butik": açık, sisli, ürünün renginde)
- Arka plan: tam ekran, ürünün glow rengiyle boyanan sisli bir stüdyo. Ortası açık ve puslu
  (glow rengi beyazla %55 karışık), kenarlara ve üste doğru koyulaşan ton (glow rengi
  siyahla %70 karışık). Ürün değişince renk 1.2 sn'de yumuşakça geçer. Örnek: Erba Pura'da
  buz mavisi-turkuaz bir pus, kenarları koyu petrol.
- Ufuk çizgisi: ekranın %80'i hizasında yumuşak, parlak yatay bir ışık bandı; altında
  cilalı, ürünün rengini hafifçe yansıtan bir zemin (MeshReflectorMaterial, blur 300,
  mixStrength 0.6).
- Havada yavaş süzülen ince toz zerreleri (beyaz-altın, 250 adet, çok küçük).
- Kaide (öndeki ürünün altında): krem-beyaz (#f3ece2) iki katlı alçak silindir. Üst kat
  yarıçap 1.6, alt kat 1.75; her katın üst kenarında ince altın halka (#d9b46a), en altta
  ince krom bir taban halkası. Kaidenin altında zemine düşen yumuşak gölge.
- Işık: üstten sıcak beyaz yumuşak ışık, ürünün iki yanında ince rim ışıklar, düşük ortam
  ışığı. ACES tone mapping. Hafif Bloom (0.15, eşik 0.9) ve Vignette (0.3).

### Şişeler (fotoğraftan 3B)
- PNG'nin alfa kanalından her satırın genişliğini ölç. Kapağın bittiği satır (neck, şişe
  boyunun ~%25'i) otomatik bulunsun: genişliğin ani arttığı ilk satır.
- Kapak: satır genişliklerinden torna (LatheGeometry); fotoğraf ön yarıya izdüşer.
- Gövde: dış çizgiden ExtrudeGeometry yassı blok (derinlik = gövde genişliğinin %42'si,
  bevel 0.05). Ön yüzde fotoğraf, arkada aynası, yanlarda fotoğrafın yan kenarından
  alınan düz renk.
- Malzeme: MeshPhysicalMaterial (roughness 0.22, clearcoat 1, envMapIntensity 1.1).
  Altın renkli bölgeler (kapak, etiket) metalik: metalness 0.8, roughness 0.3.
- Ürün boyu ekran yüksekliğinin ~%55'i, kaideye tam oturur. Boşta 10 sn'de ±1° sallanır.

### Akış (dolly carousel)
- Öndeki şişe ortada kaidede. Bir önceki şişe solda (ekranın ~%22'si), bir sonraki sağda
  (~%78'i), ikisi de %70 boyunda, biraz geride ve hafif bulanık/karartılmış. Komşular kaidesiz.
- Kaydırma: Lenis; her tekerlek hareketi tam bir ürün ilerletir (sayfalı). Geçiş 1.2 sn
  ease-in-out; giden şişe yana ve geriye kayar, gelen öne ve kaideye gelir. Son üründen sonra
  "Miért tőlünk?" bölümüne geçilir. Telefonda swipe aynı davranır.

### "Fújd be" (parfümü sık)
Zaman çizelgesi (sn): kapak kalkar 0-0.55 · başlığa basılır 0.8 · buğu 0.85-1.6 ·
kapak geri kapanır 3.1-3.8.
- Kapak yukarı ve hafifçe yana kalkar, havada hafifçe salınır, sonra yerine oturur.
- Kapağın altında sprey başlığı (altın yaka, aktüatör) görünür; 0.8'de aşağı basılır.
- Buğu: 1500 parçacık (telefonda 700), hareket tamamen shader'da: %73 ince sis (hızlı,
  konik), %20 parlayan damlacık, %7 yavaşça açılan bulut. Yön ekrana doğru, hafif yukarı.
- Buğuyla birlikte 4 nota ekranda sırayla (0.15 sn arayla) süzülerek belirsin, 3 sn sonra
  kaybolsun.
- Ses (Web Audio, dosya yok): kapak "tık", buğu "fısss" (yüksek geçiren gürültü, 0.75 sn),
  kapanış "tık". İlk tıklamada açılır.

### Arayüz (birebir yerleşim, masaüstü 1440×810 referans)
- Üst menü (yükseklik 72 px, alt kenarında %15 opak beyaz ince çizgi, arka plan yukarıdan
  aşağı koyu-saydam geçiş): solda logo; ortada Jost 12 px, harf aralığı 0.3em, büyük harf:
  "PARFÜMÖK ˅" · "ILLATKERESŐ" · "MIÉRT TÖLÜNK?" · "KAPCSOLAT"; sağda arama ikonu,
  sepet ikonu, "MENÜ" ve iki çizgili hamburger.
- Sol blok (sol kenardan 78 px, dikey ortanın biraz altında):
  - "01" büyük ince serif (64 px, altın #d9b46a), yanında 40 px ince çizgi ve "05"
    (Jost 11 px, soluk).
  - Altında "● XERJOFF · 50 ML" (Jost 12 px, harf aralığı 0.25em, altın nokta).
  - Ürün adı: Cormorant Garamond 80 px, büyük harf, harf aralığı 0.06em, krem beyaz
    (#f4ece0), hafif gölge.
  - Tagline: italik serif 22 px, en fazla 2 satır (max-width 440 px).
  - İki düğme: "FEDEZD FEL AZ ILLATOT →" (koyu yarı saydam zemin, ince açık çerçeve) ve
    "FÚJD BE" (solda küçük sprey ikonu, altın ince çerçeve). Jost 13 px, harf aralığı 0.2em,
    yükseklik 42 px.
- Sağ blok (sağ kenardan 82 px): "ILLATJEGYEK" (Jost 10 px, altın, harf aralığı 0.3em),
  altında 4 nota alt alta, sağa yaslı, italik serif 20 px, satır aralığı 34 px; sağında ince
  dikey çizgi.
- Alt kenar: solda 5 ince ilerleme çizgisi (her biri 78 px, aktif olan ürünün glow renginde
  dolu), sağda "GÖRGESS A FELFEDEZÉSHEZ" (Jost 11 px, harf aralığı 0.25em).
- Ürün değişince sol ve sağ metinler 0.6 sn'de yukarı kayarak değişir.
- Telefon (390 px): sayaç solda üstte, şişe ortada, ad, tagline ve düğmeler şişenin altında
  ortalı; notalar gizli, "Fújd be" düğmesi tam genişlikte.

### Sayfanın devamı (kaydırınca)
1. "02 — Miért tőlünk?": 4 kart, yatay dizili; her kartta küçük etiket, başlık, metin:
   - Garancia · "Csak eredeti niche parfümök" · "Garanciát vállalunk arra, hogy csakis olyan
     Niche márkák eredeti termékeit forgalmazzuk, ami a legmagasabb minőséget biztosít a
     vásárlóink részére."
   - Minta · "Próbáld ki előbb" · "Lehetőséget biztosítunk számos parfümnél az illat
     kipróbálására, egy 5 ml minta kiszerelés formájában."
   - TikTok · "Saját, magyar leírás minden illathoz" · "Weboldalunkon a parfümökhöz saját,
     magyar leírás készül, illetve TikTok videóban is bemutatjuk, prezentáljuk az általunk
     forgalmazott termékeinket."
   - 50 000 Ft felett · "Ajándék gyári parfümminta" · "Rendelj 50 000 Ft felett és AJÁNDÉK
     gyári parfümmintát adunk rendelésedhez!"
2. "Összes parfüm": 4 illatcsalád sekmesi (Friss és citrusos #3f9a8c · Virágos #c46a8a ·
   Gyümölcsös és gourmand #d08a3a · Fűszeres, fás és oudos #8a5a34); ürün kartları galeri
   düzeninde (kart: şişe görseli, marka, ad, hacim, fiyat, "Kosárba").
3. "Illatkereső": 3 soru (nappal vagy este · friss vagy meleg · virágos vagy fás), cevaplara
   göre notalardan puanla en uygun parfümü öner, önerilen şişe kaideye insin.
4. "Rólunk": başlık "Luxus niche parfümök legjobb illatai! Találjuk meg a Signature
   illatodat!", istatistikler "400+ luxus parfüm · 32 niche márka · 5 ml minta".
5. GYIK (açılır kapanır): Eredeti termékeket forgalmaztok? · Kipróbálhatom az illatot
   vásárlás előtt? · Jár ajándék a rendelés mellé? · Hogyan fizethetek? · Mi történik, ha egy
   termék nincs készleten? · Hogyan érlek el titeket? (cevaplar markanın kendi metinleri).
6. "Kapcsolat": Telefon +36 30 139-8405 · E-mail info@parfumorult.hu · Instagram ve TikTok
   @parfumorult · Fizetés: Simple bankkártya (OTP csoport), Banki átutalás, Utánvét.
7. Altbilgi: kayan şerit "Parfümőrült · Luxus niche parfümök · Signature illatod · Eredeti
   termékek · 5 ml minta · Ajándék parfümminta 50 000 Ft felett" ve not: "Ez az oldal a
   Parfümőrült számára készült független koncepció demó, és nem áll kapcsolatban a márka
   tulajdonosával."

### Kalite
Konsolda hata yok, ilk açılış 3 sn içinde, telefonda akıcı. Kodu bileşenlere ayır: Scene,
Backdrop, Floor, Pedestal, Carousel, BottleMesh, Sprayer, Spray, Effects, sound.js, UI
bölümleri.
```

---

## Kurgusal sürüm (YouTube için güvenli)

Promptun "Marka" ve "Ürünler" bölümlerini şununla değiştir. Gerisi aynı kalır, tasarım değişmez:

```
### Marka
Ad: "Maison Éclat" · alt başlık "Signature Collection" · logo: krem renkli el yazısı
"Maison Éclat" yazısı (SVG olarak sen çiz). Metinler Türkçe.

### Ürünler
Kendi şişe fotoğraflarım public/products/ klasöründe (01.png ... 05.png, arka planı
silinmiş). Adları, notaları ve renkleri sen uydur; renkler sırayla buz mavisi #4b9aab,
bal #c69b52, gece moru #3a3440, kırmızı #c63d31, kızıl #c5423c olsun.
```
