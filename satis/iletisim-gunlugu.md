# İletişim günlüğü

Kime ne gönderildi, kimden ne geldi, ne konuşuldu, sırada ne var. Her yeni mesajda buraya bir satır eklenir; gelen ve giden metinlerin tam hâli `yazismalar/<firma>/` klasöründe saklanır.

**Kurallar**
- Tarih biçimi: GG.AA.YYYY. Bilinmeyen bilgi "bilinmiyor" yazılır, tahmin yazılmaz.
- Yön: **Giden** (biz gönderdik) · **Gelen** (onlar yazdı) · **Görüşme** (telefon/toplantı) · **Not** (iç karar).
- Firmanın genel durumu ayrıca `parfum-firmalari.csv`'de güncellenir.

---

## Kronolojik kayıt

| Tarih | Firma | Yön | Kanal | Kimden → Kime | Özet | Dosya |
|---|---|---|---|---|---|---|
| bilinmiyor | Parfumane | Giden | E-posta | Berka → Parfumane (muhtemelen sales@parfumane.com; doğrula) | İlk satış maili + 3D demo linki | taslak: `parfumane-mail.md` |
| 01.10.2026 | Parfumane | Gelen | E-posta | Parfumane ("PARFUMANE" imzalı) → Berka | Demo için teşekkür; teknik sorular: altyapı, WooCommerce entegrasyonu, PayTR, TRY/USD, WPML/WCML, SEO, performans, 3D doğruluğu, kaynak kod ve model hakları, bakım | `yazismalar/parfumane/2026-10-01-gelen-teknik-sorular.md` |
| 01.10.2026 | Parfumane | Not | — | — | Sitelerinde Woodmart teması + Elementor + WPML + LiteSpeed Cache olduğu tespit edildi. Karar: yeni site değil, Woodmart üzerine alt tema; WooCommerce olduğu gibi kalır, staging'de pilot | — |
| 01.10.2026 | Parfumane | Giden | E-posta | Berka → Parfumane (gelen maile yanıt) | Teknik cevap: mevcut site ve alan adı korunur, alt tema yaklaşımı, staging'de kurulum ve tek tıkla geri dönüş; her soruda demo ile canlı kurulum ayrımı; demonun eksikleri açıkça yazıldı; kaynak kod ve 3D modellerin teslimde devredileceği söylendi; bakım paketi kapsam ve ücretinin teklifte sunulacağı yazıldı; pilot önerildi | `yazismalar/parfumane/2026-10-01-giden-teknik-cevap.txt` |

---

## Firma bazında durum

### Parfumane (parfumane.com)
- **Kişiler:** Bekir Kantarcı (kurucu), Yasir Kantarcı (koku uzmanı). Teknik sorular "PARFUMANE" imzasıyla geldi; yazan kişinin adı belli değil.
- **İletişim:** sales@parfumane.com, support@parfumane.com, merkez ofis 0530 400 65 77.
- **Altyapıları:** WordPress + WooCommerce, Woodmart teması, Elementor, WPML/WCML (TR/EN, TRY/USD), PayTR, LiteSpeed Cache.
- **Durum:** Teknik sorulara cevap gönderildi (01.10.2026); dönüş bekleniyor.
- **Verdiğimiz sözler (mailde yazılı):**
  - Mevcut site, alan adı, URL'ler ve WooCommerce korunacak; Woodmart üzerine alt tema.
  - Staging'de pilot, onay sonrası canlıya; eski temaya tek tıkla geri dönüş.
  - Canlı veri (fiyat, stok, dil, para birimi), gerçek sepet (çoklu ürün, varyasyon), PayTR değişmeden çalışacak.
  - Ölçüye dayalı GLB şişe modelleri; zayıf cihazlarda görsel yedeği; kurulum sonrası PageSpeed raporu.
  - Kaynak kod ve 3D modeller teslimde Parfumane'ye devredilecek.
  - GTM'e 3D etkileşim olayları gönderilecek.
- **Mailde açıkça kabul edilen demo eksikleri:** Sepete yalnızca ilk ürün aktarılıyor; veriler canlı değil; # ile çalışan adresler SEO'ya uygun değil; şişeler ölçüyle modellenmedi; zayıf telefon yedeği yok; PageSpeed ölçümü yok.
- **Sırada:**
  - Dönüş gelirse: teklif dokümanı (kurulum + aylık bakım paketleri + opsiyonel ekler; fiyatları Berka belirleyecek).
  - Pilot için onlardan istenecekler: staging erişimi, yönetici hesabı, 2–3 şişe ailesinin ölçüleri ya da numuneleri.
  - Teknik hazırlık: kendi WordPress + WooCommerce test kurulumumuzda alt temaya başlamak.
- **Takip:** Dönüş olmazsa 4–5 iş günü sonra kısa bir hatırlatma.

### Diğer firmalar (demo hazır, gönderim kaydı yok)
Aşağıdakilerin demosu ve satış mesajı hazır; gönderildiklerine dair kayıt yok. Gönderdikçe yukarıdaki tabloya satır ekle.

| Firma | Demo | Mesaj taslağı | Not |
|---|---|---|---|
| Çakır Parfümeri | `demolar/cakir-Netlify.zip` | `cakir-mail.md` | WhatsApp öncelikli |
| JOURE Perfume | `demolar/joure-Netlify.zip` | `joure-mail.md` | Online satış yok; vitrin modu |
| ILLUSIONE | `demolar/illusione-Netlify.zip` | `illusione-mail.md` | |
| MAD Parfumeur | `demolar/mad-Netlify.zip` | `mad-mail.md` | LinkedIn öncelikli |
| ANYMO Paris | `demolar/anymo-Netlify.zip` | `anymo-mail.md` | Yalnızca kendi adını taşıyan 12 koku |
| Pekji | `demolar/pekji-Netlify.zip` | `pekji-mail.md` | |
| Parfümőrült | `demolar/parfumorult-Netlify.zip` | `parfumorult-mail.md` | Macarca |
| Mes Bisous, Regalien, Royal Platinum, Türkan, Unique, Mardini, Attar Al Has, Lalive | `demolar/` | `*-mail.md` | Önceki dönem demoları |

**Atlananlar ve bekleyenler** (gerekçeleri `parfum-firmalari.csv`'de): Marko Parfüm, Buse Parfümeri ve Suyu Parfüm atlandı; Parfumoriaa ve Kız Kulesi Parfüm veri alınamadığı için bekliyor.
