# Sıfırdan 3B mum sitesi: YouTube videosu için prompt

LA FANN demosu tek bir prompttan çıkmadı; kendi demo motorumuz üzerinde adım adım geliştirildi. Bu dosya, aynı sonucu sıfırdan kurdurmak için o çalışmanın kararlarını tek bir prompta toplar. Videoda iki yol var:

- **A. Tek prompt:** "Ana prompt"u olduğu gibi yapıştır.
- **B. Adım adım (video için önerilen):** Önce ana promptun "Proje" ve "Teknik" bölümlerini ver, sonra aşağıdaki 6 adımı sırayla yapıştır. Her adımın sonunda sonucu ekranda göster. İzleyici neyin nereden geldiğini daha iyi görür, hata çıkarsa da düzeltmesi kolay olur.

> **Önemli:** Videoda gerçek bir markanın (LA FANN) logosunu, ürün fotoğraflarını ve adını kullanmak için izin al ya da kurgusal bir marka kullan (örnek: "LUMIÈRE Atelier"). Aşağıdaki prompt kurgusal markayla yazıldı. Kendi ürün fotoğraflarını `public/products/` klasörüne koyman yeterli.

---

## Ana prompt

```
Sıfırdan, sinematik bir 3B ürün vitrini web sitesi kur: lüks kokulu mum markası "LUMIÈRE Atelier".
Ziyaretçi kaydırdıkça mumlar karanlık, altın detaylı bir butik salonda tek tek kaideye gelsin;
mumlar kendiliğinden tutuşsun, alev titresin, ucundan duman yükselsin, arkada usul bir fon müziği çalsın.

## Proje
- Teknoloji: Vite + React 18 + @react-three/fiber 8 + three 0.163 + @react-three/drei +
  @react-three/postprocessing + lenis (yumuşak kaydırma) + zustand (durum).
- Tek sayfa. Masaüstü ve telefonda kusursuz çalışsın; telefonda da 60 fps hedefle.
- Türkçe arayüz. Fontlar: başlıklar "Bodoni Moda", metin "Jost" (Google Fonts).
- Ürünler bir JSON dosyasından gelsin (src/products.json):
  [{ "name": "Amber & Patchouli", "family": "Amber · Topraksı", "size": "200 g", "price": 2400,
     "notes": ["Amber", "Paçuli"], "accent": "#e0a440", "image": "products/amber.png",
     "wick": [0.48, 0.20] }, ... ]  (5 mum)
  image: arka planı silinmiş PNG ürün fotoğrafı. wick: fitilin fotoğraftaki yeri (0-1 oranında x, y).

## Sahne: karanlık butik salon
1. Arka duvar: ürünün arkasında içbükey kavisli dev bir duvar (silindir parçası, yarıçap ~18,
   yay ~180°; kenar komşu ürünler duvarın önünde kalsın). Duvar bir ShaderMaterial:
   koyu kahve-siyah zemin üzerinde ince altın çizgili sekizgen kafes deseni; desen ortada
   (ürünün arkasında) sıcak bir ışık havuzuyla aydınlanır, kenarlara doğru kararır.
   Işık havuzunun rengi o an öndeki ürünün accent rengine yumuşakça (1-2 sn) geçer.
   Duvar kaydırınca kaymaz, sabit kalır; yalnız rengi değişir.
2. Duvarın üst ortasında marka logosu: beyaz, saydam PNG'den, duvarın kavisine oturan altın
   kabartma (alfa kenarlarından emboss, fırçalanmış altın gradyan, 7 sn'de bir soldan sağa
   ince bir ışık süpürmesi, arkasında ürün renginde yumuşak hale). Telefonda daha küçük ve
   biraz aşağıda.
3. Zemin: koyu, cilalı, yansıtıcı (drei MeshReflectorMaterial, hafif bulanık yansıma).
4. Kaide: beyaz, alçak silindir (yarıçap ~1.9, yükseklik ~0.35), üst kenarında ince altın halka.
5. Tepeden ürünün üstüne düşen dar, sıcak bir spot ışık; ortam ışığı düşük (sinematik kontrast).
6. Havada çok ince, yavaş süzülen altın toz zerreleri (Points, 300 adet).
7. Son işlem: Bloom (intensity 0.28, luminanceThreshold 0.86), Vignette (0.5), hafif tone mapping
   (ACES). Bloom yalnız alev ve parlak noktalarda belirgin olsun.

## Ürünler: fotoğraftan 3B mum
- Her ürün PNG'si için alfa kanalından dış çizgi (contour) çıkar, ExtrudeGeometry ile kalın
  bir blok yap (derinlik ürün genişliğinin ~%40'ı, hafif pahlı kenar). Ön yüze fotoğrafın
  kendisi, arka yüze aynalı hâli, yan yüzlere fotoğrafın kenar renginden düz renk.
  Önden bakınca fotoğraf kadar net görünmeli (bulanık, şişkin, plastik görünüm olmasın).
- Malzeme: MeshPhysicalMaterial, map = fotoğraf (sRGB, anisotropy 8), roughness 0.35,
  clearcoat 0.6, envMapIntensity 0.8. Ürünler kaidenin üstüne tam otursun.

## Akış (carousel) ve kaydırma
- Ürünler duvarın önünde yatay bir yay üzerinde dizili: öndeki ortada kaidede, komşular
  solda ve sağda biraz geride, küçük ve hafif karartılmış.
- Tek tekerlek hareketi ya da tek kaydırma = bir sonraki ürün (sayfalı kaydırma). Geçiş
  1.7 sn, ease-in-out; geçerken ürün hafifçe kalkıp yeni kaideye iner (arada boşluk kalmaz).
  Geçiş sürerken gelen ek kaydırmalar yok sayılır.
- Telefonda kaydırma (swipe) aynı şekilde tek ürün ilerletir.

## Mum alevi, ışık ve duman (en önemli kısım)
Her mum için fitil konumunda (wick) üç düzlem (plane) çiz, hepsi depthWrite: false,
toneMapped: false:
1. Alev (ShaderMaterial, AdditiveBlending): gözyaşı biçimi. y = 0..1 yükseklikte genişlik
   w(y) = 0.46 · y^0.42 · (1 − y)^0.75. Dipte ince mavi, ortada beyaz-sarı çekirdek
   (renk değeri >1, bloom'a takılsın), dışta turuncu. Gürültüyle titreme: boy %88-100 arası
   oynar; yükseldikçe sağa sola salınır (salınım y² ile artar). Çıktı:
   gl_FragColor = vec4(renk · a, 1.0)  (toplamalı karışımda alfayı iki kez çarpma!).
   Alev boyu ürün boyunun ~%30'u; fitilden başlayıp kabın ağzının üstüne taşar.
2. Işıltı: alevin çevresinde daha büyük bir düzlemde sıcak turuncu radyal hale, alevle
   birlikte titrer.
3. Duman: alevin ucundan yükselen ince, kıvrılan bir iz. fbm gürültüsüyle yatay kıvrım
   (yükseldikçe artar), yukarı doğru genişler, parçalanır ve kaybolur. Açık gri, opaklık ~0.5,
   NormalBlending.
Davranış:
- Sayfa açılınca mumlar sırayla, 0.45 sn arayla kendiliğinden tutuşsun: önce kısa bir
  parlama (alev %135), sonra sakin yanma; tutuşurken duman 3 sn boyunca yoğunlaşıp incelsin.
- Öndeki mum tam güçte, komşular %78. Bir mum öne gelince bir an yeniden canlansın (parlama).
- Tüm geçişleri kare hızına değil gerçek zamana göre yap (performance.now, üstel yaklaşım).
- Sahnede TEK bir sıcak PointLight (#ffae5c, distance 9) öndeki mumun alevini izlesin ve
  alevle birlikte titresin; duvarın ışık havuzu da aynı titreşimle çok hafif (±%8) oynasın.
  (Her muma ayrı ışık koyma: performans düşer.)

## Fon müziği (dosya yok, Web Audio ile üretilir)
- Dört akorluk yavaş döngü, her akor 9 sn: Dmaj9 (146.83, 220, 277.18, 329.63, 369.99 Hz),
  Bm9 (123.47, 185, 220, 277.18, 293.66), Gmaj7 (98, 146.83, 185, 246.94, 293.66),
  A6sus (110, 164.81, 185, 246.94, 293.66).
- Pad: her nota için ±4 cent akortsuz iki osilatör (kök sine, diğerleri triangle), alçak
  geçiren süzgeç 700 Hz, 3 sn'de açılıp akor sonunda 3.5 sn'de kapanan zarf.
- Piyano: her akorda üst notalardan 3-4 tanesi bir oktav yukarıda, 1.4-2.6 sn düzensiz
  aralıkla; sine + 2. ve 3. harmonik, hızlı atak, ~4 sn sönüm.
- 4.5 sn'lik uzun yankı (gürültüden üretilmiş convolver), toplam ses çok kısık.
- Tarayıcı kuralı gereği ilk tıklama/dokunuşta yavaşça (4 sn) açılsın. Üst menüde "Ses"
  düğmesi: çalarken dalgalanan dört çubuk, tıklayınca kapanır/açılır, tercih hatırlansın.

## Arayüz (3B sahnenin üstünde HTML)
- Üst menü: solda logo (beyaz), ortada "Ürünler · Koku Bulucu · Hakkımızda · İletişim",
  sağda Ses düğmesi, arama, TR/EN, sepet, Menü. İnce, yarı saydam, altında ince çizgi.
- Sol blok (dikey ortada): büyük "01" sayacı ve "— 05", altında ◆ koku ailesi · gramaj
  (küçük, aralıklı büyük harf), dev serif ürün adı (iki satıra sığsın), italik nota satırı,
  altın çerçeveli "Kokuyu keşfet →" düğmesi.
- Sağ blok: "NOTALAR" başlığı ve notalar alt alta (italik serif), yanında ince dikey çizgi.
- Altta solda ürün ilerleme çubukları (her ürün bir çizgi, aktif olan altın), sağda
  "Keşfetmek için kaydır".
- Ürün değişince metinler yumuşak bir geçişle (yukarı kayarak, 0.6 sn) değişsin.
- Telefon: sayaç üstte solda, ürün ortada, ad ve düğme ürünün altında ortalı.

## Kalite kuralları
- Gerçek ürün fotoğraflarını ve metinlerini kullan; uydurma bilgi yazma.
- Konsolda hata olmasın; ilk açılış 3 sn içinde (doku sıkıştırma, lazy load).
- Kodu bileşenlere ayır: Scene, Boutique (duvar, logo, zemin), Carousel, CandleMesh,
  Candle (alev/ışıltı/duman), FlameLight, Effects, sound.js, UI.
```

---

## Adım adım promptlar (video için)

Önce ana prompttan **"Proje"** bölümünü ver, sonra sırayla:

**1. İskelet ve sahne**
```
Vite + React + R3F projesini kur. Karanlık butik sahnesini yap: içbükey kavisli duvar
(sekizgen altın kafes desenli ShaderMaterial, ortada sıcak ışık havuzu), cilalı yansıtıcı
zemin, beyaz kaide ve altın halka, tepeden sıcak spot. Kamera sabit, hafif aşağıdan.
```

**2. Fotoğraftan 3B mum**
```
products.json'daki PNG fotoğraflardan 3B mum yap: alfa kanalının dış çizgisinden
ExtrudeGeometry blok, ön yüzde fotoğraf, yanlarda kenar rengi. Önden fotoğraf kadar net
görünsün. Mumu kaideye oturt.
```

**3. Kaydırma ve geçiş**
```
Mumları yay üzerinde diz: öndeki kaidede, komşular yanlarda geride. Tek kaydırma = bir
sonraki mum, 1.7 sn ease-in-out, geçerken mum hafifçe kalkıp iner. Duvarın ışık rengi
öndeki ürünün accent rengine yumuşakça geçsin, duvar kaymasın.
```

**4. Canlı alev ve duman**
Ana prompttaki **"Mum alevi, ışık ve duman"** bölümünü olduğu gibi yapıştır.

**5. Logo, bloom ve atmosfer**
```
Duvarın üstüne altın kabartma logo (ışık süpürmesi, arkasında hale), havada altın toz
zerreleri, Bloom + Vignette. Sinematik ve karanlık, ama ürün net okunsun.
```

**6. Arayüz ve müzik**
Ana prompttaki **"Arayüz"** ve **"Fon müziği"** bölümlerini yapıştır.

---

## Videoda göstermek için püf noktaları

- Fotoğraftaki alev çoğu zaman aşırı parlak bir şerit gibidir. Alevi fotoğraftan sil (ya da
  fitilin olduğu kısmı koyulaştır) ve yerine shader alevi koy: en çok fark yaratan adım bu.
- Toplamalı karışımda (AdditiveBlending) `alpha = a` yazarsan saydamlık iki kez çarpılır ve
  ışıltı görünmez olur. `vec4(renk * a, 1.0)` yaz.
- Mum başına ayrı ışık koyma; tek ışık öndeki alevi izlesin.
- Alevin tutuşma ve titreme animasyonlarını gerçek zamana bağla; yavaş cihazda da aynı hızda
  oynar.
- Müzik ilk tıklamadan önce çalmaz (tarayıcı kuralı); videoda bunu söyle, yoksa izleyici
  "ses gelmiyor" diye düşünür.
