# Günlük komut

Aşağıdaki bloğu Claude Code'a yapıştır ya da zamanlanmış göreve koy. Çalışma klasörü deponun kökü (`analiz/`) olmalı.

```
BerkAİ Stüdyo ekibini bugün için çalıştır. Proje: kanal/projeler/berkai-studyo/. Soru sorma; kendi kararını ver, işi bitir, sonunda kısa rapor yaz.

ÖNCE OKU
1. kanal/README.md, kanal/SERI.md, kanal/YAZIM_REHBERI.md
2. kanal/projeler/berkai-studyo/README.md, veri/kanal_kurallari.md, veri/ajans/ajans_kurallari.md, veri/ajans/ret_listesi.json
3. gunler/ altındaki en yeni günün klasörü: 06_mudur/gunluk_rapor.md, 06_mudur/kararlar_bekleyen.json, 05_mail/takip.csv, 03_musteri/adaylar.json ve varsa kararlar.json (benim onay/ret kararlarım). kararlar.json yoksa hiçbir kararı onaylanmış sayma; bekleyenleri yeni rapora taşı.

KURALLAR (değişmez)
- Dışarıya hiçbir şey gönderme: mail, mesaj, yükleme, yayın yok. Her şey taslak.
- Uydurma veri, işletme, kaynak yok. Bulamadığını "bulunamadı" diye yaz. Her sayının kaynağı dosyada dursun.
- Yalnızca işletmenin sitesinde yayınlanmış kurumsal iletişim bilgisi. Cep telefonu ve kişisel e-posta kaydetme.
- Ret listesindekilere, önceki günlerin adaylar.json dosyalarında geçenlere ve origin/claude/charming-dirac-aq3a53:satis/parfum-firmalari.csv içindekilere yeniden aday muamelesi yapma; "zaten listede" de.
- Bahis, kumar, kripto, replika yok. Teklifte ve videoda fiyat/kazanç rakamı yok. Demo sitede "Bağımsız konsept demo — işletmeyle resmi bir bağı yoktur" notu. Mailde "yazma" seçeneği.
- Kural dosyalarını ve veri/ klasörünü değiştirme. Ret listesine ekleme gerekiyorsa müdür kararı olarak öner.
- git commit/push yapma (ben istersem söylerim). Yerel sunucu açma; testler araclar/yerel.js ile diskten.

BUGÜNÜN İŞİ: gunler/<bugünün tarihi YYYY-AA-GG>/ altına, dünkü klasörle aynı düzende yaz. Her ekip klasöründe ekip.json olsun (dünkünün alanları: ad, kisa, tek_satir, ozet, pano, rakamlar, calisanlar, belgeler).

1. KARARLARI İŞLE (müdür): Onaylanan mailler için takip.csv'de durum "Gönderim bekliyor (onaylandı)"; gönderim tarihi yazılmışsa +4 ve +7 gün hatırlatma tarihlerini hesapla, bugün günü gelen hatırlatmanın taslağını yaz. Reddedilenleri "Soğuk" yap. Dünkü takip.csv'yi bugüne taşı.
2. KONU EKİBİ (01_konu): vidIQ varsa kanalın son videoları (@kargazihni), son 7 günün Türkçe trendleri ve ilgili aramalar; yoksa web araması. Günde en fazla 50 vidIQ kredisi. Bu hafta kalan yayın günleri (pazartesi "Claude ile Yaptım", perşembe "Claude ile 3D Site", 13:17) için öneriler; her önerinin yanında kanıt (video, kanal, abone, izlenme, tarih). Dünkü önerilerle karşılaştır: ne değişti?
3. YAPIM EKİBİ (02_yapim): Onaylanan (ya da en güçlü) konu için tam paket: arastirma_dogrulama.md (her iddia + kaynak), senaryo.md (ham ~640 sn; kelime ve cümle sayısını hesapla), basliklar.md (≤60 karakter, say), aciklama.txt (kanal/sablon/ACIKLAMA_SABLONU.txt düzeni, kaynaklar ve bölümler), thumbnail.md (≤4 kelime), shorts.md (≤60 sn). Dün hazırlanan paket hâlâ geçerliyse yeniden yazma; yalnızca değişeni güncelle ve sıradaki bölümün paketine geç.
4. MÜŞTERİ BULMA (03_musteri): 8–10 yeni gerçek işletme bul (dünkü rapordaki "yarın" notuna bak). Her birini ölç:
   NODE_PATH=/opt/node-tools/node_modules node araclar/site_olc.js gunler/<tarih>/03_musteri <slug>=<url> ...
   Ekran görüntülerine bak. degerlendirme.json yaz (dünkünün biçimi), sonra: node araclar/aday_tablosu.js gunler/<tarih>/03_musteri. aday_raporu.md yaz: neden ihtiyaçları var, kim neden elendi. "Bekliyor" olan eski adayları yeniden kontrol et.
5. 3D SİTE EKİBİ (04_site): En iyi 1–2 yeni aday için siteler/_motor/markalar/<slug>.json ayarı yaz (yalnızca doğrulanmış bilgi; ürün adı uydurma; etiketlerde "konsept" notu). Gerekirse siteler/_motor/site.js içine yeni kodla çizilen ürün modeli ekle; işletmenin fotoğrafını kopyalama.
   node araclar/site_uret.js <slug>
   NODE_PATH=/opt/node-tools/node_modules node araclar/site_test.js gunler/<tarih>/04_site <slug> ...
   node araclar/site_rapor.js gunler/<tarih>/04_site
   Ekran görüntülerine tek tek bak; kalan kontrol varsa düzelt, yeniden test et. Dünkü demoların test dosyalarını da bugüne taşı ki ofiste görünsünler.
6. MAİL EKİBİ (05_mail): Yeni adaylara kişiye özel taslak (≤80 kelime, tek soru, adresin kaynağı, "yazma" seçeneği, fiyat yok), takip_plani.md ve takip.csv. Demosu olmayan ya da adresi bulunamayan işletmeye taslak yazma; nedenini yaz.
7. MÜDÜR (06_mudur): gunluk_rapor.md (ne çıktı, bilmem gerekenler, yapılamayanlar, yarın) ve kararlar_bekleyen.json (her karar: id, baslik, soru, oneri, gerekce, onay_olursa, ret_olursa, ilgili). Dünden cevaplanmamış kararları yeniden sor.
8. OFİSİ GÜNCELLE VE TEST ET:
   node araclar/ofis_veri_uret.js
   NODE_PATH=/opt/node-tools/node_modules node araclar/ofis_test.js gunler/<tarih>/06_mudur/ofis_test
   "gecti": true olmalı; ekran görüntülerine bak (paneller dolu mu, yazılar okunuyor mu).

BİTİNCE kısa rapor: her ekibin bugünkü dosyaları, yeni adaylar ve nedenleri, yapılan demolar ve test sonuçları, benden istenen kararlar, yapılamayanlar.
```

## Kararların bu komuta nasıl ulaşır
1. Ofiste müdür odasına gir, kararları onayla ya da reddet.
2. "Kararları dışa aktar"a bas; inen `kararlar.json` dosyasını `gunler/<o günün tarihi>/kararlar.json` olarak kaydet.
3. Mail gönderdiysen `gunler/<tarih>/05_mail/takip.csv` dosyasında "Gönderim tarihi" sütununu doldur.
4. Ertesi gün komutu çalıştır. Dosya yoksa ekip hiçbir kararı onaylanmış saymaz.
