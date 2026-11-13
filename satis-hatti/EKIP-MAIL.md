# Gönderim (şimdilik elle, ücretsiz)

`ayar.json → "gonderim": "elle"`: alan adı olmadan otomatik toplu mail Gmail hesabını kapattırır. Bu yüzden:

1. Bulma ekibi maili hazırlar; demo yayına çıkınca firma panelin **Bugün gönderilecekler** listesine düşer.
2. Çalışan ortak Gmail hesabında oturum açıkken "Gmail'de aç"a basar: alıcı, konu, metin, imza ve çıkış notu
   dolu gelir. Kontrol eder, Gönder'e basar, panelde **Gönderdim** der.
3. 5 gün sonra cevap yoksa takip maili aynı listeye düşer. Cevap gelirse "Cevap geldi" işaretlenir, takip gitmez.
4. Liste günde `gunluk_limit` (15) mail gösterir.

Bulma ekibi her turun başında panelin `isaretler` koleksiyonunu okuyup `hat.py durum <slug> <durum>` ile
kayda geçirir (`gonderildi`, `takip_gonderildi`, `cevap_geldi`, `ilgilenmiyor`, `cikti`); bkz. `PANEL.md`.

Alan adı alınınca: `ayar.json`'da `"gonderim": "otomatik"`, `gonderen`, `cevap_adresi` doldurulur, `kuru: false`;
`python3 satis-hatti/hat.py gonder` Resend ile kendisi gönderir.

## Otomatik gönderim (Brevo, ücretsiz, alan adı gerekmez)

`ayar.json`: `"gonderim": "brevo"`, `"gonderen": "BerkAİ Studio <ortak-gmail@gmail.com>"` (Brevo'da doğrulanmış
gönderen), `"cevap_adresi"`: aynı Gmail, `"kuru": false`. Brevo anahtarı ortamın ağ gizli anahtarlarında
(`api.brevo.com`, başlık `api-key`) ya da `BREVO_API_KEY` ortam değişkeninde.

Mail ekibi turu: önce `PANEL.md`'deki işaret senkronu, sonra `python3 satis-hatti/hat.py gonder`, sonra panel güncellemesi,
commit ve push. `gonderim` "elle" iken `gonder` çalışmaz; o zaman yalnızca senkron ve panel güncellemesi yapılır.
