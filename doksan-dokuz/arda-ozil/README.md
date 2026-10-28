# Doksan Dokuz — "Mourinho Bunu Daha Önce Yaptı: Arda Güler, Yeni Özil mi?"

Karga Zihni'nin **Akış** kurgu stiliyle (krem zemin, kelime kelime blur-in yazı, tek tuval + kayan kamera,
odak geçişi, yalnızca pop/tık/zil sesleri) üretilen ~11,5 dakikalık video.

| Dosya | Görev |
|---|---|
| `script.py` | Senaryo: 52 sahne, seslendirme metinleri |
| `tts.py` | ElevenLabs seslendirme ("Berkay" sesi, `eleven_v4`), kelime zamanlarıyla |
| `plan.py` | Her sahnede hangi fotoğraf/yazı/istatistiğin hangi kelimede belireceği |
| `akis.py` | Akış motoru (Karga Zihni `karga-edit/render_akis.py` uyarlaması, skia) |

## Çalıştırma
```
pip install skia-python numpy pillow requests    # Linux: apt-get install libegl1
export ELEVENLABS_API_KEY=...                      # anahtarı repoya koymayın
python3 tts.py BUILD                               # BUILD/vo/*.mp3 + *.json
# BUILD/fonts: InterTight500/600/800.ttf, InstrumentSerifItalic.ttf, JBMono.ttf
# BUILD/img: plan.py'deki anahtar adlarıyla fotoğraflar + avatar.jpg (kanal profil fotoğrafı)
python3 akis.py BUILD stills 5 60 120              # kontrol kareleri
python3 akis.py BUILD render 4                     # müzikli + müziksiz MP4 ve altyazı
```

Fotoğraflar Wikimedia Commons'tan, serbest lisanslı (CC BY / CC BY-SA / kamu malı). Atıf listesi
`BUILD/img/credits.json` içinde; video açıklamasına eklenmeli.
