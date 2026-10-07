# Sıfırdan 3B parfüm sitesi: YouTube videosu için prompt

Parfüm demoları (O'JUVI, Portelier, Soleil de Grâce, LA FANN parfümleri) tek bir prompttan çıkmadı; kendi demo motorumuz üzerinde adım adım geliştirildi. Bu dosya o çalışmanın kararlarını, aynı sonucu sıfırdan kurdurmak için tek bir prompta toplar. Videoda iki yol var:

- **A. Tek prompt:** "Ana prompt"u olduğu gibi yapıştır.
- **B. Adım adım (video için önerilen):** Önce ana promptun "Proje" bölümünü ver, sonra aşağıdaki 7 adımı sırayla yapıştır ve her adımda sonucu ekranda göster.

> **Önemli:** Videoda gerçek bir markanın logosunu, şişe fotoğraflarını ve adını izinsiz kullanma; satış maili gönderdiğimiz firmaları da videoda gösterme. Aşağıdaki prompt kurgusal "MAISON ÉCLAT" markasıyla yazıldı. Kendi şişe fotoğraflarını `public/products/` klasörüne koyman yeterli.

---

## Ana prompt

```
Sıfırdan, sinematik bir 3B parfüm vitrini web sitesi kur: niş parfüm markası "MAISON ÉCLAT".
Ziyaretçi kaydırdıkça şişeler karanlık, altın detaylı bir butik salonda tek tek kaideye gelsin;
her kokunun kendi ışık rengi olsun; "Parfümü sık" düğmesine basınca kapak kalksın, şişeden
buğu çıksın ve notalar ekranda belirsin.

## Proje
- Teknoloji: Vite + React 18 + @react-three/fiber 8 + three 0.163 + @react-three/drei +
  @react-three/postprocessing + lenis (yumuşak kaydırma) + zustand (durum).
- Tek sayfa. Masaüstü ve telefonda kusursuz çalışsın; telefonda da akıcı (60 fps hedefi).
- Türkçe ve İngilizce arayüz (TR/EN düğmesi). Fontlar: başlıklar "Cinzel", gövde
  "Cormorant Garamond", küçük etiketler "Jost" (Google Fonts).
- Ürünler bir JSON dosyasından gelsin (src/products.json):
  [{ "name": "Ambre Noir", "family": "Oryantal · Odunsu", "size": "100 ml", "price": 5800,
     "notes": { "top": ["Bergamot", "Safran"], "heart": ["Gül", "İris"], "base": ["Amber", "Oud", "Vanilya"] },
     "accent": "#d8b05a", "image": "products/ambre-noir.png", "neck": 0.22 }, ... ]  (4-6 parfüm)
  image: arka planı silinmiş PNG şişe fotoğrafı (önden). neck: kapağın bittiği satır,
  şişe boyuna oranla (0-1).

## Sahne: karanlık butik salon
1. Arka duvar: ürünün arkasında içbükey kavisli dev bir duvar (silindir parçası, yarıçap ~18,
   yay ~180°; komşu şişeler duvarın önünde kalsın). Duvar bir ShaderMaterial; dört desen
   seçeneği olsun (ayardan seçilsin, ürün değişince 1.2 sn'de yumuşakça geçebilsin):
   a) gece mermeri (koyu damarlı, altın damar parıltısı)
   b) ışıklı kemerler (yan yana yüksek kemer nişleri, içleri sıcak ışıkla dolu)
   c) altın kafes (ince altın çizgili sekizgen desen)
   d) dalgalar (yumuşak, yatay ışık dalgaları)
   Duvar ortada (şişenin arkasında) sıcak bir ışık havuzuyla aydınlanır, kenarlara doğru
   kararır. Işık havuzunun rengi öndeki parfümün accent rengine 1-2 sn'de yumuşakça geçer.
   Duvar kaydırınca KAYMAZ, sabit kalır; yalnız rengi değişir.
2. Duvarın üst ortasında marka logosu: beyaz saydam PNG'den, duvarın kavisine oturan
   fırçalanmış altın kabartma (alfa kenarlarından emboss, 7 sn'de bir soldan sağa ince ışık
   süpürmesi, arkasında kokunun renginde yumuşak hale). Telefonda küçük ve biraz aşağıda,
   sayaçla çakışmasın.
3. Tepeden şişenin üstüne, kokunun renginde 3 ince ışık huzmesi (açık uçlu, toplamalı
   karışımlı silindirler, yavaşça nefes alır).
4. Zemin: koyu, cilalı, yansıtıcı (MeshReflectorMaterial, hafif bulanık yansıma).
5. Kaide: siyah mermer, torna profili (alçak, yuvarlak kenarlı), üst ve alt kenarında ince
   altın halka. Şişe kaideye tam otursun.
6. Havada yavaş süzülen ince altın toz zerreleri (Points, ~300).
7. Son işlem: Bloom (0.16, luminanceThreshold 0.93), Vignette (0.34), ACES tone mapping.

## Şişeler: fotoğraftan 3B
- PNG'nin alfa kanalından her satırın genişliğini ölç (profil). Şişeyi iki parçada kur:
  a) Kapak (neck satırının üstü): profil satırlarından torna (lathe) geometrisi; fotoğraf ön
     yarıya, aynası arka yarıya izdüşsün.
  b) Gövde (neck altı): dış çizgiden ExtrudeGeometry ile yassı blok (derinlik gövde
     genişliğinin %42'si, pahlı kenar). Ön yüzde fotoğraf, arkada aynası, yanlarda
     fotoğrafın kenar renginden düz renk.
  Önden bakınca fotoğraf kadar net görünsün; şişkin, bulanık, plastik görünüm olmasın.
- Malzeme: MeshPhysicalMaterial (map = fotoğraf, sRGB, anisotropy 8; roughness 0.25,
  clearcoat 1, envMapIntensity 1). Altın/sarı tonlu bölgeler (kapak, yaka) metalik olsun:
  shader'da altın tonunu algıla, oralarda metalness 0.8, roughness 0.3.
- Şeffaf camlı şişede gövdenin içinde kokunun renginde yarı saydam sıvı (gövdenin %86'sı
  kadar, üstte hava payı). Şişe hareket edince sıvı yüzeyi eylemsizlikle yatıp yay-sönüm ile
  salınarak durulsun.
- Boşta şişe çok yavaş (10 sn'de ±1°) sağa sola dönsün.

## Akış (carousel) ve kaydırma
- Şişeler duvarın önünde yatay bir yay üzerinde: öndeki ortada kaidede, komşular solda ve
  sağda biraz geride, küçük ve hafif karartılmış.
- Tek tekerlek hareketi ya da tek kaydırma = bir sonraki parfüm (sayfalı kaydırma). Geçiş
  1.7 sn, ease-in-out; şişe hafifçe kalkıp yeni kaideye iner, arada boşluk kalmaz. Geçiş
  sürerken gelen ek kaydırmalar yok sayılır. Telefonda kaydırma (swipe) aynı şekilde.

## "Parfümü sık" (en önemli kısım)
Zaman çizelgesi (saniye): kapak kalkar 0-0.55, başlığa basılır 0.8, buğu 0.85-1.6,
kapak geri kapanır 3.1-3.8.
1. Kapak: görünmez bir el kaldırmış gibi biraz yukarı ve yana kalkar, hafifçe eğik havada
   asılı kalır, hafif nefes alır (bob), sonra yerine oturur.
2. Sprey başlığı: kapağın altında görünür; metal yaka, aktüatör ve ince delik. 0.8'de
   aşağı basılır.
3. Buğu: ~1500 parçacık (telefonda 700), bütün hareket shader'da tek bir başlangıç anı,
   ağız konumu ve yönünden hesaplanır (her sıkmada yeniden oynar). Üç tür parçacık:
   %73 ince sis (hızlı, konik açılır), %20 ışıkta parlayan damlacık, %7 yavaş açılıp dağılan
   yumuşak bulut. Yön: ekrana doğru, hafif yukarı (izleyicinin yüzüne). Rengi beyazdan
   kokunun rengine hafif.
4. Notalar: buğuyla birlikte ekranda üst, kalp ve dip notaları sırayla belirsin (yukarı
   süzülerek, 0.15 sn arayla), birkaç saniye sonra kaybolsun.
5. Ses (Web Audio, dosya yok): kapak kalkınca kısa "tık", buğuda yüksek geçiren süzgeçten
   geçen gürültü "fısss" (0.75 sn), kapanınca "tık". İlk tıklamada açılır; üst menüde "Ses"
   düğmesi (dalgalanan dört çubuk) ile kapanır.

## Nota piramidi ve koku bulucu
- "Kokuyu keşfet" ile ürün detayına geçilsin: şişe sağa kayar, solda nota piramidi.
  Kaydırdıkça şişe katman katman açılır: üst notalar, kalp notaları, dip notalar (her
  katmanda notalar büyük serif yazıyla, aile ve kısa açıklama).
- Koku bulucu: üç soru (gün mü gece mi · taze mi sıcak mı · çiçeksi mi odunsu mu), cevaplara
  göre notalardan puanla en uygun parfümü öner; önerilen şişe kaideye insin.

## Arayüz (3B sahnenin üstünde HTML)
- Üst menü: solda logo, ortada "Parfümler · Koku Bulucu · Hakkımızda · İletişim", sağda Ses,
  arama, TR/EN, sepet, Menü. İnce, yarı saydam, altında ince altın çizgi.
- Sol blok (dikey ortada): büyük "01" sayacı ve "— 04", altında ◆ koku ailesi · 100 ml
  (küçük, aralıklı büyük harf), dev serif parfüm adı, italik ilk üç nota, altın çerçeveli
  "Kokuyu keşfet →" ve "Parfümü sık" düğmeleri.
- Sağ blok: "NOTALAR" başlığı ve notalar alt alta (italik serif), yanında ince dikey çizgi.
- Altta solda ürün ilerleme çizgileri (aktif olan altın), sağda "Keşfetmek için kaydır".
- Ürün değişince metinler yumuşakça (yukarı kayarak, 0.6 sn) değişsin.
- "Sepete ekle" markanın mevcut mağazasına gitsin (Shopify ise /cart/<variant>:1 bağlantısı).
- Telefon: sayaç üstte solda, şişe ortada, ad ve düğmeler şişenin altında ortalı.

## Kalite kuralları
- Gerçek ürün fotoğraflarını ve metinlerini kullan; uydurma bilgi yazma.
- Konsolda hata olmasın; ilk açılış 3 sn içinde (doku sıkıştırma, lazy load).
- Kodu bileşenlere ayır: Scene, Boutique (duvar, logo, huzmeler, zemin), Pedestal, Carousel,
  BottleMesh (kapak + gövde + sıvı), Sprayer, Spray (buğu), Effects, sound.js, UI.
```

---

## Adım adım promptlar (video için)

Önce ana prompttan **"Proje"** bölümünü ver, sonra sırayla:

**1. İskelet ve butik sahnesi**
```
Vite + React + R3F projesini kur. Karanlık butik sahnesini yap: içbükey kavisli duvar
(ışıklı kemerler desenli ShaderMaterial, ortada sıcak ışık havuzu), cilalı yansıtıcı zemin,
siyah mermer kaide ve altın halkalar, tepeden 3 ince ışık huzmesi.
```

**2. Fotoğraftan 3B şişe**
Ana prompttaki **"Şişeler: fotoğraftan 3B"** bölümünü yapıştır.

**3. Kaydırma ve kokuya özel renk**
```
Şişeleri yay üzerinde diz: öndeki kaidede, komşular yanlarda geride. Tek kaydırma = bir
sonraki parfüm, 1.7 sn ease-in-out, şişe hafifçe kalkıp iner. Duvarın ışık rengi ve
huzmeler öndeki parfümün accent rengine yumuşakça geçsin; duvar kaymasın.
```

**4. Logo ve atmosfer**
```
Duvarın üstüne fırçalanmış altın kabartma logo (ışık süpürmesi, arkasında hale), havada
altın toz zerreleri, Bloom + Vignette. Sinematik ve karanlık, ama şişe net okunsun.
```

**5. "Parfümü sık"**
Ana prompttaki **"Parfümü sık"** bölümünü yapıştır.

**6. Nota piramidi ve koku bulucu**
Ana prompttaki **"Nota piramidi ve koku bulucu"** bölümünü yapıştır.

**7. Arayüz**
Ana prompttaki **"Arayüz"** bölümünü yapıştır.

---

## Videoda göstermek için püf noktaları

- Şişeyi tek parça "şişirilmiş" bir modelle yapma: kapak torna, gövde yassı blok olunca
  fotoğraf kadar net görünür. En çok fark yaratan karar bu.
- Duvar kaydırmayla kayınca ucuz durur; sabit duvar + değişen ışık rengi çok daha premium.
- Arka plan fotoğraftan kesilirken kapağın altındaki boyun ve camın şeffaf tabanı çentikli
  kalabilir; dış çizgiyi yumuşatmak (smoothing) ve tabanı dışbükey zarfla doldurmak işe yarar.
- Buğu parçacıklarını JavaScript'te tek tek güncelleme; hepsini shader'da tek bir başlangıç
  anından hesapla, telefonda da akıcı kalır.
- Tarayıcılar sesi ilk tıklamadan önce çalmaz; videoda bunu söyle.
- Duvar desenini videoda canlı değiştir (mermer → kemer → kafes): izleyiciye "aynı sahne,
  farklı marka" esnekliğini gösterir.
