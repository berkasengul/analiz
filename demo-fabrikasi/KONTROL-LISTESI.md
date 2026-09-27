# Demo kontrol listesi

Her demo markaya gönderilmeden önce bu liste baştan sona kontrol edilir. Liste,
önceki demolarda yaptığımız hatalardan çıkarıldı; yeni bir hata bulunca aşağıdaki
"Hata günlüğü"ne ekle ve listeye bir madde olarak yaz.

## 1. Ürün ve ambalaj

- [ ] Ambalaj markanın gerçek ürün fotoğrafına göre yapıldı mı? (biçim, renk, kapak, etiket düzeni)
- [ ] Fotoğrafı olmayan ürünler sayfadaki notta "temsili" diye belirtildi mi?
- [ ] Fotoğrafı olan ürünlerde gerçek fotoğraflar detay galerisinde ve kartta görünüyor mu?
- [ ] Her ürün farklı mı görünüyor? (aynı etiketin rengi değişmiş kopyası değil, gerçekteki farklar)
- [ ] Arka yüz (koku piramidi / içerik) okunuyor mu?
- [ ] Logo ve yazı tipi markanınkine yakın mı?
- [ ] Etiket şişenin yüzeyine oturuyor mu (kenarlarda havada kalmıyor)? Açık renkli üründe yazılar ışıkta okunuyor mu?

## 2. Sahne ve renk

- [ ] Arka plan ışığı (`theme.glow`) ürünün ambalaj rengiyle uyumlu mu? (açık renk tüp → açık, sıcak ışık)
- [ ] Sektöre uymayan süsler kaldırıldı mı? (parfüm kristali kremde yok; `particles`, `crystals`)
- [ ] Arka plandaki bulanık manzara anlamlı mı? Etiketteki yazılar görünüyorsa `backdrop: false`.
- [ ] Marka simgesi (başlık, yükleme ekranı, favicon) sektöre uygun mu? (`icon`)

## 3. Yazılar

- [ ] Menü ve düğmeler sektöre göre mi? ("Kokular" / "Ürünler", "Şişeyi keşfet" / "Ürünü keşfet")
- [ ] Türkçe büyük harf hataları yok mu? ("HOPE İN", "EXTRAİT", "KREMI" gibi) İngilizce adlar `lang="en"`, Türkçe adlar `nameLang: "tr"`.
- [ ] İngilizce modda ürün adları İngilizce mi? (`products[].en.name`)
- [ ] Başka markadan kalan yazı var mı? (slogan, kayan bant, SSS, yükleme yazısı, sepet adı)
- [ ] Zaman çizelgesinde aynı yıl iki kez geçmiyor mu? (tekrar eden anahtar hatası)

## 4. Doğruluk

- [ ] Her bilgi bir kaynaktan mı? (kuruluş yılı, kurucu, notalar, fiyat, satış noktaları)
- [ ] Uydurma müşteri yorumu, basın alıntısı ya da rakam yok.
- [ ] Emin olunmayan bilgi (kurucunun annesi, parfümör adı vb.) yazılmadı ya da yumuşatıldı.
- [ ] Instagram ve web adresleri doğrulandı mı? Doğrulanmadıysa gizli (`null`).

## 5. Mağaza

- [ ] Fiyatlar ürün bazında mı? (`products[].price`) Farklı ürünler aynı fiyatta görünmüyor.
- [ ] Set fiyatları yuvarlak mı? (₺1.690, ₺1.691 değil) Kuruşsuz mu? (₺890, ₺890,00 değil)
- [ ] Ücretsiz seçenekler "Ücretsiz" yazıyor mu? (hediye kutusu fiyat tekrar etmiyor)
- [ ] Sepete ekleme, adet değiştirme ve ücretsiz kargo eşiği doğru mu?

## 6. Teknik

- [ ] Tarayıcı konsolunda hata yok.
- [ ] Tıklamalar gerçek fare/dokunma ile test edildi (kodla `.click()` yetmez; `pointer-events` hatalarını gizler).
- [ ] Ek sayfalar (ör. `#/urunler`) doğrudan linkle açılınca yükleme ekranı kapanıyor mu? Oradan ana sayfaya dönünce bütün bölümler görünüyor mu?
- [ ] Her kategori sayfası (`#/urunler/<kategori>`) 3B akışla açılıyor; kategori değiştirince ve ana sayfaya dönünce sepet korunuyor.
- [ ] Masaüstü ve telefon: ana sayfa, detay, 4 hikâye kartı, ritüel, mağaza, sepet, hikâye, SSS.
- [ ] Telefonda detay kartı ürünü kapatmıyor; içerik açıklaması dokununca çıkıyor.
- [ ] Netlify zip güncel (`yeni-demo.py` en son çalıştırıldı), `noindex` var.

## Hata günlüğü

| Demo | Hata | Nasıl düzeldi / önlem |
|---|---|---|
| TCL | Ürün şişe diye çizildi, gerçekte ince kutu | Önce ürün fotoğrafı iste; ambalaj fotoğrafa göre |
| TCL | Kutu yazıları fotoğraftakine benzemiyordu | Etiketi fotoğraftan birebir çiz |
| Hope | Tüm şişeler aynı altın renkte çizildi | Her ürünün fotoğrafına bak; renkler ürün bazında |
| Hope | "HOPE İN A BOTTLE", "EXTRAİT" | İngilizce metinlerde `lang="en"` |
| Hope | Sayfa yazıları ürünle ilgisizdi | İçerik markanın kendi metinlerinden |
| Lalive | Arka planda etiket yazıları bulanık göründü | `backdrop: false` |
| Lalive | Güneş kremi fildişi, arka plan kahverengi | `theme.glow` ambalaj renginden |
| Lalive | "GÜNEŞ KREMI" (Türkçe İ yok) | `nameLang: "tr"` |
| Lalive | Kremde parfüm kristalleri, şişe ikonu | `particles: "leaves"`, kristaller kapalı, `icon: "leaf"` |
| Lalive | Tüm ürünler aynı fiyat, ₺1.691,00 | Ürün bazlı fiyat, yuvarlama, kuruşsuz gösterim |
| Lalive | Hediye kutusu ücretli sanılıyordu | "Ücretsiz" yazısı |
| Lalive | Katalog sayfasında kartlara tıklanamıyordu (`main` pointer-events) | Gerçek tıklama testi; `.catalog { pointer-events: auto }` |
| Lalive | `#/urunler` doğrudan açılınca yükleme ekranı kapanmıyordu | Katalog sayfası açılınca yükleme tamamlanır |
| Lalive | ₺1.333,9 (tek haneli kuruş) | Kuruşlu fiyatlar iki haneli |
| Lalive | Katalogdan ana sayfaya dönünce alt bölümler görünmez kalıyordu (`.reveal` yeniden izlenmiyordu) | Sayfa değişince görünme izleyicisi yeniden kurulur; dönüş testi eklendi |
| Lalive | "Ürünler" ve "Tüm ürünler" menüde karışıyordu; katalog başlığı menünün altında kalıyordu | Menü: "Öne çıkanlar" + "Kategoriler" açılır paneli; katalogda buzlu cam üst bant |
| Lalive | Kategori sayfasında üstteki kategori çubuğu ürünün tepesini kapattı | Masaüstünde kategoriler solda dikey dizin |
| Lalive | Sepette ürün numarası tutuluyordu; sayfalar farklı ürün seti gösterince yanlış ürün çıkardı | Sepet katalog kimliğiyle (`c:<id>`); eski sepetler dönüştürülür |
| Lalive | Az ürünlü kategoride sonsuz yay yan ürünleri gizliyordu | 5'ten az üründe ürünler yan yana düz sırada |
| Lalive | Etiketler yuvarlak şişenin önünde düz yama gibi duruyordu | Etiket gövdenin kavisine sarılır (`wrapLabelGeo`) |
| Lalive | Açık renkli ambalajlarda spot ışığı yazıları siliyordu; etiket parfüm gibi parlaktı | Işık ambalaj rengine göre kısılır; `labelFinish` ile mat kâğıt etiket |
| Lalive | Ürüne oturma, tekerleği yavaş çevirince kullanıcıyı geri çekiyordu | Oturma kaydırma yönünde ve kaydırma bittikten sonra |
| Lalive | 15 ürün fotoğrafsız, tahminle çizildi; basit görünüyordu | Marka sitesine erişim yoksa kullanıcıdan ürün sayfası fotoğrafları istenir; ilk ürün (Yüz Bakım Yağı) fotoğraftan birebir |
| Lalive | Fiyatlar eski arama sonuçlarındandı | Markanın ürün sayfasındaki güncel fiyatlar |
| Lalive | Kategori yuvarlak hacimde köşeli ürünler (mum, sabun) yastık gibi "X" gölgeli | Yuvarlak ürünlerde satır satır silindir kesiti; kalıp sabun ve kutular düz profil |
| Lalive | Kart görseli kesit fotoğrafı büyütüp kırpıyordu | Kesitli kartta görsel mutlak konumlu, `contain` |
| Lalive | Fotoğraftan şişirilen ürünler "ortadan yarılmış", kenarları tırtıklı, tüplerde yatay çizgiler | Yuvarlak ürün: silüetten dönen gövde + önden izdüşüm doku; düz ürün: kenar çizgisinden pahlı blok; arka fotoğrafı yoksa yazısız arka |
| Lalive | Aktarma tekrar çalışınca ana sayfa sırası kaydı; ritüelde fırça çıktı | Ana sayfanın ilk 6 ürünü sabit liste; ritüel kremlerle |
| Lalive | Başka renk seçeneğinin fotoğrafı arka yüz sanıldı | Arka fotoğraf rengi ön yüze yakın olmalı |
