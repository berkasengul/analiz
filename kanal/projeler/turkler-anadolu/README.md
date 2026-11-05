# Türkler Anadolu'ya nasıl geldi? (kodla çizilmiş harita animasyonu)

Seri A "Claude ile Yaptım", ilk animasyon bölümü.

- `harita.py`: eski harita stili çekirdeği.
  - Natural Earth 50m kara/göl/nehir verisi, elle dağ sıraları ve deniz adları.
  - Yaklaşık dönem sınırları (`TERR`), göç/sefer yolları (`ROUTES`), şehirler (`CITY`), görünümler (`VIEWS`).
- `render_turk.py`: zaman çizelgesinden kare üretir.
  - Harita katmanları, yıl kartı ve üst zaman çizelgesi, kelime kelime alt yazı.
  - Kartlar: başlık, Orhun Yazıtı, neden göç, sözlük, Turchia, özet, kod, nasıl.
  - Malazgirt savaş şeması (temsilî).
- `script.py`: metin + sahne komutları.
  - `("map", görünüm, "+emp:x", "-city:y", "+route:z", "year:1071", "date:..", "era:..")`
  - `("card", tür, aşama)` ve `("battle", aşama)`
- **Veri:** `ne_50m_land`, `ne_50m_lakes` ve `ne_50m_rivers_lake_centerlines` GeoJSON dosyaları ana betiklerin bir üst klasöründe `ist/data/` altında durur. Kaynak: nvkelso/natural-earth-vector, `geojson/`.

Üretim: `tts_xi.py` → `render_turk.py stills ...` → `render_turk.py render 4` → 1.25x hızlandır ve sıkıştır (`kanal/README.md`).
Yeni bir harita animasyonu için bu klasörü kopyala; `TERR`, `ROUTES`, `CITY`, `VIEWS` ve `script.py` dosyalarını konuya göre değiştir.
