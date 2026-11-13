# Panel

Adres: https://claude.ai/artifact/GhrvePVoo1aTvA9nJ3Wzgn (sayfa: `satis-hatti/panel.html`, `db` yeteneği).

Veritabanı:
- `firmalar/<slug>`: her firma (ekipler yazar; kaynak `firmalar.json`).
- `ozet/son`: son güncelleme zamanı ve ayarlar (kuru mod, günlük sınır).
- `isaretler/<slug>`: kullanıcının panelde bastığı "Cevap geldi / İlgilenmiyor / Çıkış istedi" (`{durum, t}`).

## Her ekip turunun başında

1. `ArtifactData list` → `isaretler`. Her işaret için (o durum `firmalar.json`da zaten işlenmediyse):
   `python3 satis-hatti/hat.py durum <slug> <durum> "panelden işaretlendi"` (`cikti` ise adres `cikanlar.txt`'ye eklenir).
   İşlenen işareti silme; panelde seçili kalsın.

## Her ekip turunun sonunda

1. `python3 satis-hatti/hat.py panel` → `.panel/firmalar/<slug>.json` ve `.panel/ozet.json`.
2. `ArtifactData list` → `firmalar` ve `ozet` (sürüm numaraları için).
3. `ArtifactData batch` (en çok 50 yazım): her firma için `{op: "set", collection: "firmalar", doc_id, file_path, if_version}`
   (yeni firmada `if_version` yok) ve `{op: "set", collection: "ozet", doc_id: "son", file_path: ".panel/ozet.json", if_version}`.
