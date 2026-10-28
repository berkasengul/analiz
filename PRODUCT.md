# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anne-babalar (perakende). 2–12 yaş çocukları için pijama takımı arayan veliler; çoğunlukla Instagram'da ya da pazaryerlerinde markayı görüp siteye gelen, telefondan alışveriş yapan, çocuğunun sevdiği desene göre karar veren kişiler. İşleri: takımı yakından görmek, yaşa uygun bedeni seçmek, sepete ekleyip satın almak ya da WhatsApp'tan soru sormak.

## Product Purpose

SESA KIDS'in çocuk pijama takımlarını doğrudan veliye satan mağaza sitesi. Başarı: ziyaretçinin ürünü gerçekten giyilmiş halde, her açıdan görüp güvenle beden seçmesi ve satın alması (ya da WhatsApp üzerinden sipariş vermesi).

## Positioning

Pijamalar, gerçek çocuk modellerin üzerinde ve 360° dönen 3D modellerle sergilenir; veli ürünü önden, yandan ve arkadan görür. Her takımın kendi desen hikâyesi var (kalpli kedi, helikopter, çilek, kutup ayısı, rakun, kirpi).

## Operating Context

- Trafik ağırlıklı olarak Instagram'dan ve mobilden gelir.
- Satış kanalları: site içi sepet/ödeme (ödeme altyapısı henüz bağlı değil), WhatsApp, Instagram ve pazaryerleri.
- Ürün fotoğrafları stüdyoda, SESA KIDS filigranlı çekiliyor; 3D modeller Tripo ile fotoğraflardan üretiliyor.

## Capabilities and Constraints

- Statik site (HTML/CSS/JS, Three.js), derleme yok: `store/`.
- Ürün başına: ad, açıklama, renk, beden listesi (yaş aralığı), fiyat, fotoğraf, isteğe bağlı 3D model (GLB ya da turntable kareleri).
- Sepet tarayıcıda saklanır; ödeme demo.
- Açık kararlar: gerçek fiyatlar, gerçek beden tablosu, ürün kodları, ödeme sağlayıcısı, WhatsApp numarası, pazaryeri bağlantıları. Şimdilik örnek değerler kullanılıyor (₺449, 2–12 yaş) ve öyle kalması istendi.

## Brand Commitments

- Ad: SESA KIDS. Logo: "SESA" mavi (#79c3f6), "KIDS" pembe (#f59bd6), iki yanda turuncu/pembe/mavi ışın çizgileri; yuvarlak harfler.
- Site renkleri logodaki mavi, pembe ve turuncudan türemeli; çocuklara hitap eden, canlı ama premium bir his.
- Alan adı: www.sesakids.com.tr.

## Evidence on Hand

- Gerçek ürün fotoğrafları (6 takım): `store/assets/*.png` (arka planı temizlenmiş).
- Kalpli Kedi takımının Tripo 3D modeli (turntable videosundan 120 kare): `store/assets/spin/kalpli-kedi/`.
- Müşteri yorumu, satış rakamı, sertifika ya da basın içeriği yok; uydurulmamalı.

## Product Principles

1. Ürün her şeyden önce gelir: takım net, büyük ve her açıdan görülebilir olmalı.
2. Gerçeği göster: gerçek çocuklar, gerçek pijamalar; ürünü olduğundan farklı gösteren görüntü kullanılmaz.
3. Telefonda kolay: beden seçimi ve sepete ekleme tek elle, birkaç dokunuşta.
4. Çocuk neşesi, yetişkin güveni: renkli ve sevimli ama özenli ve premium.

## Accessibility & Inclusion

Metinler renkli zeminlerde okunur kalmalı (WCAG AA kontrast). Hareket, sistemde "hareketi azalt" seçiliyse kısılmalı.
