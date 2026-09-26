# Satış sistemi (parfüm)

| Dosya | Ne |
|---|---|
| `parfum-firmalari.csv` | 14 firmalık takip tablosu (Excel / Google Sheets ile açılır) |
| `mesajlar-parfum.md` | Her firmaya özel ilk mesaj, cevap ve hatırlatma metinleri |
| `../demo-fabrikasi/` | Marka ayar dosyasından 3B demo üreten sistem |
| `../teklif-hope/` | Teklif PDF'i şablonu (marka adı ve görseller değiştirilerek kullanılır) |

## Akış

1. **Mesaj:** Tablodan A öncelikli bir marka seç → hesabı takip et, 2–3 gönderiyi beğen → izin mesajını gönder.
2. **Tabloyu doldur:** Durum = `Mesaj gönderildi`, İlk mesaj tarihi, hatırlatma tarihleri (+4 ve +7 gün).
3. **Cevap gelirse:** Durum = `İlgilendi`. Markanın 3–5 ürün fotoğrafını topla, Claude'a ayar dosyasını hazırlat, fabrikada demoyu üret, Netlify'a yükle, linki gönder. Durum = `Demo gönderildi`.
4. **Teklif:** Olumlu dönüşte PDF'i maille gönder, görüşme ayarla. Durum = `Teklif` → `Kazanıldı` / `Kaybedildi`.
5. **Cevap yoksa:** +4 günde hatırlatma, +7 günde son mesaj, sonra Durum = `Soğuk` (3 ay sonra tekrar denenebilir).

## Günlük rutin (20–30 dk)

- **Yeni mesajlar:** 5–10 kişiye özel mesaj; toplu ya da otomatik gönderim yok, Instagram hesabı kapanabilir.
- **Hatırlatmalar:** Tarihi gelenleri gönder.
- **Tablo:** Güncelle.

## Hedef

- **Oran:** Soğuk mesajlarda cevap oranı ~%5–10, satışa dönüş ~%1–3.
- **Hacim:** Ayda 60–100 kişiye özel mesaj ≈ 1–2 satış.

## Önemli

- **Paylaşım:** Demolar gerçek marka adı ve tasarımı içerir. Linki sadece o markaya gönder, herkese açık paylaşma.
- **E-posta yasası:** Firmalara (tacir/esnaf) ticari e-posta atarken çıkış seçeneği sun ("bir daha yazmamamı isterseniz söylemeniz yeterli"). Güncel kuralları kendin de kontrol et.
- **Doğrulama:** Tablodaki `(bul)` ve `(doğrula)` alanlarını mesaj atmadan önce doldur. Instagram ve siteleri buradan açamadığım için elle kontrol gerekiyor.
