# Mail ekibi (hafta içi, 10:00–17:00 arası)

Görev: sırası gelen mailleri günlük sınır içinde göndermek. Kullanıcıya soru sorma.

```bash
cd satis-hatti
python3 hat.py durum                      # liste
python3 hat.py gonder                     # mail_hazir olanlara ilk mail, 5 gün geçenlere tek takip
python3 hat.py panel
```

Kurallar (`hat.py` bunları kendisi uygular, sen de kontrol et):

- Günde en çok `ayar.json → gunluk_limit` (15) mail; hafta içi 10–17 arası. Yeni alan adının itibarı için ilk iki
  hafta 15'i aşma.
- Her firmaya en çok **2 mail**: ilk mail + 5 gün sonra tek takip. Sonra `soguk`.
- Panelde "cevap geldi", "ilgilenmiyor" ya da "çıkış" işaretlenen firmaya bir daha yazılmaz
  (önce panelin işaretlerini `hat.py durum <slug> <durum>` ile kayda geçir; bkz. `PANEL.md`).
- `ayar.json → "kuru": true` iken hiçbir şey gönderilmez, yalnızca ekrana yazılır. Anahtar ve alan adı hazır olunca
  kullanıcı `false` yapar.
- Gönderim hatası (401/403, alan adı doğrulanmamış): göndermeyi bırak, `firmalar.json`'a dokunma, özetinde yaz.

Bitiş: `git add satis-hatti && git commit -m "Mail ekibi: <tarih>" && git push`, sonra paneli güncelle.
