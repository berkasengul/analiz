# YouTube Shorts Otomasyonu (Ücretsiz Stack)

Trend araştır → Script yaz → Seslendir → Video kur → YouTube'a yükle.

## Pipeline

```
1. trends.py   → Trend konuları çeker (Google Trends + YouTube RSS)
2. script.py   → Claude API ile Sh0orts metni + altyazı üretir
3. voice.py    → edge-tts ile seslendirir (ücretsiz, Türkçe)
4. visuals.py  → Pexels'ten stok video çeker (ücretsiz API)
5. assemble.py → FFmpeg ile 9:16 video + altyazı + ses birleştirir
6. upload.py   → YouTube Data API ile yükler
```

main.py hepsini sırayla çalıştırır.

## Kurulum

### 1. Sistem bağımlılığı (FFmpeg)
```bash
# Mac:    brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: https://ffmpeg.org/download.html (PATH'e ekle)
ffmpeg -version   # kontrol
```

### 2. Python bağımlılıkları
```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. API anahtarları
`config/.env.example` dosyasını `config/.env` olarak kopyala ve doldur:

- **ANTHROPIC_API_KEY** — https://console.anthropic.com (script üretimi için, ücretli ama çok ucuz)
- **PEXELS_API_KEY** — https://www.pexels.com/api/ (ücretsiz, stok video)
- **YouTube** — `config/client_secret.json` (Google Cloud Console → YouTube Data API v3 → OAuth)

edge-tts hiçbir key gerektirmez.

## Kullanım

```bash
# Tek bir Short üret (yüklemeden)
python main.py --steps trends script voice visuals assemble

# Üret + yükle
python main.py --all

# Belirli konuyla
python main.py --topic "yapay zeka tarihi" --all
```

## Önemli notlar
- YouTube tamamen otomatik AI içeriğe karşı politikalar uyguluyor. Monetizasyon
  için içeriğe insan dokunuşu (kürasyon, düzenleme) ekle.
- YouTube API günlük yükleme kotası sınırlı (kota dolunca ertesi gün dener).
- İlk çalıştırmada YouTube OAuth tarayıcıda izin ister, token'ı saklar.
