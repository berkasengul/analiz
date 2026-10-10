# Bu sürümde yapılan değişiklikler (Codex'e aktarmak için)

Codex'te düzenlenen `index.html` üzerine yapıldı. Blender salon dosyaları
(`models/web/showroom-blender.glb`, `showroom-luxury-details.glb`) ve `curated-*.glb`
dosyaları değiştirilmedi; bu klasörde yoklar, mevcut projenizdekiler kullanılır.

## Yeni dosyalar
| Dosya | İçerik |
|---|---|
| `models/web/bmw-420i-coupe.glb` | BMW 420i (G22 M430i gövdesi), meshopt, 2,2 MB |
| `models/web/vw-golf-7.glb` | VW Golf 7, meshopt, 1,5 MB |
| `models/web/ford-kuga.glb` | Ford Kuga, temizlenip statikleştirildi, meshopt, 1,8 MB |
| `models/web/extra-models.js` | Bu üç modelin base64 kopyası (`file://` ile açılış için) |

### Ford Kuga'ya yapılan temizlik
Orijinal dosya bir oyun aracı modeliydi:
- Parçaların hepsi iskelete (skin) bağlıydı. İskelet bağlama pozunda geometriye "pişirildi", iskelet kaldırıldı.
- Dosyada tek tekerlek vardı. Bu tekerlek `wheel_lf/rf/lr/rr` kemiklerine kopyalandı; sağ taraf aynalandı.
- Üst üste binen iki kaporta sürümünden biri (`bodyshell1.001`) ile birebir kopya parçalar silindi.
- Aracın önü +z'ye çevrildi. Sıkıştırmadan önce yaklaşık 300 bin üçgendi, şimdi 190 bin.

## Araç görünümleri (ilandaki gibi)
- **BMW 420i:** koyu bordo metalik, siyah jant, mavi kaliper. Kaporta normalleri yumuşatıldı (`smoothNormals`).
- **VW Golf:** beyaz, gümüş jant. Model GTI kasa: kırmızı çizgi, kaliper ve GTI rozetleri Midline'a göre karartıldı.
  Önceki eşlemede `FrontColor` boya sanılmıştı; o parça VW logosu, gerçek kaporta `Color_B06`.
- **Ford Kuga:** beyaz, Titanium jant, siyah çamurluk kaplamaları. Önceki eşlemede çamurluk kaplaması
  (`vehicle_generic_smallspecmap_PRIMARY`) boya sanılmıştı; gerçek kaporta `silver_PRIMARY`.
- Ateca ve Corsa için `curated-0/5.glb` dosyaları aynen kullanılıyor.

## Hata düzeltmesi: sıkıştırılmış modellerde geometri bozulması
`prepareCarModel` parçaları birleştirirken `applyMatrix4` çağırıyordu. Meshopt'un tam sayı (Int16)
konumlarına bu şekilde yazılınca geometri bozuluyordu. Şimdi bütün öznitelikler önce Float32'ye
çevriliyor (`toFloatAttribute`). Böylece birleştirme de çalışıyor ve konsoldaki "mergeGeometries failed" uyarıları kalktı.

## Kamera (sinematik)
- Konum yolu centripetal Catmull-Rom eğrisi; yön yaw/pitch üzerinden Catmull-Rom.
  Hız anahtar karelerde kesilmez, bakış noktası kameranın altından geçmez.
- Araç başına 3 çekim, sırasıyla:
  1. far/tampon yakın planı (FOV 32)
  2. geri çekilen açılış planı
  3. alçak yan profil

  Sağ sıradaki araçlarda sıra terstir; kamera iki araç arasında koridoru "kayarak" geçer.
- Kaydırma ataleti kritik sönümlü yay ile çalışır: yumuşak kalkış, yumuşak duruş.
- Kaydırma durunca kamera özne etrafında çok yavaş bir "steadicam" kayması yapar.
- Dönüşlerde hafif roll var; bazı karelerde hafif dutch açı.
- Araç çekimlerinde sinematik bantlar genişler; ekranda hafif film greni var.
- Yardımcı fonksiyon: `carAt(s)`. Sabit: `SHOTS_PER_CAR = 3`. Kaydırma uzunluğu: `SEG_VH = 72`.

## Atmosfer (Blender salonuyla çakışmayan katmanlar)
- Işıkta süzülen toz zerreleri.
- Araç adalarının altında hacimsel ışık huzmeleri.
- Uzakta alacakaranlık şehir silueti.
- Meydan kenarında sıcak ışıklı babalar.
