"""Pexels'ten konu ile eşleşen stok video çeker ve output/ klasörüne kaydeder."""
import os
import re
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / "config" / ".env")

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
PEXELS_SEARCH_URL = "https://api.pexels.com/videos/search"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output"

# Shorts için dikey (9:16) video tercih edilir; yoksa yatay kabul edilir
_PREFERRED_MIN_HEIGHT = 1080
_PREFERRED_MIN_WIDTH = 607   # ~1080 * 9/16


def _build_query(topic: str) -> str:
    """Konudan kısa bir arama sorgusu üretir (ilk 5 kelime, özel karaktersiz)."""
    clean = re.sub(r"[^\w\s]", "", topic)
    words = clean.split()[:5]
    return " ".join(words)


def _pick_file(video_files: list[dict]) -> dict | None:
    """Video dosyaları arasından en uygun kaliteyi seçer.

    Öncelik sırası:
      1. Dikey (yükseklik > genişlik) ve >= 1080p
      2. Dikey, herhangi bir çözünürlük
      3. En yüksek çözünürlüklü dosya
    """
    portrait = [f for f in video_files if f.get("height", 0) > f.get("width", 0)]
    hd_portrait = [
        f for f in portrait
        if f.get("height", 0) >= _PREFERRED_MIN_HEIGHT
        and f.get("width", 0) >= _PREFERRED_MIN_WIDTH
    ]

    candidates = hd_portrait or portrait or video_files
    return max(candidates, key=lambda f: f.get("height", 0) * f.get("width", 0), default=None)


def _search_videos(query: str, per_page: int = 15, orientation: str = "portrait") -> list[dict]:
    """Pexels API'den video listesi döndürür."""
    if not PEXELS_API_KEY:
        raise EnvironmentError(
            "PEXELS_API_KEY bulunamadı. config/.env dosyasına ekleyin."
        )

    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": query,
        "per_page": per_page,
        "orientation": orientation,
        "size": "medium",
    }
    resp = requests.get(PEXELS_SEARCH_URL, headers=headers, params=params, timeout=15)
    resp.raise_for_status()
    return resp.json().get("videos", [])


def _download(url: str, dest: Path) -> Path:
    """URL'den dosyayı indirip dest konumuna kaydeder, Path döndürür."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True, timeout=60) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 16):
                f.write(chunk)
    return dest


def fetch_video(topic: str, name: str = "short") -> Path:
    """Konuya uygun bir Pexels videosu indirir.

    Args:
        topic: Arama konusu (Türkçe veya İngilizce).
        name:  Çıktı dosyasının temel adı (ör. 'short_1234567890').

    Returns:
        İndirilen video dosyasının Path nesnesi.

    Raises:
        EnvironmentError: PEXELS_API_KEY eksikse.
        RuntimeError: Uygun video bulunamazsa.
        requests.HTTPError: API veya indirme hatası.
    """
    query = _build_query(topic)
    print(f"  Pexels aranıyor: '{query}' (dikey)...")

    videos = _search_videos(query, orientation="portrait")

    # Dikey sonuç yoksa yatay dene
    if not videos:
        print("  Dikey video bulunamadı, yatay aranıyor...")
        videos = _search_videos(query, orientation="landscape")

    if not videos:
        raise RuntimeError(
            f"Pexels'te '{query}' için video bulunamadı. "
            "Farklı bir konu deneyin veya API anahtarını kontrol edin."
        )

    # İlk birkaç videodan en uygun dosyayı seç
    chosen_file = None
    for video in videos[:5]:
        chosen_file = _pick_file(video.get("video_files", []))
        if chosen_file:
            video_id = video.get("id", "?")
            print(f"  Seçilen video ID={video_id} "
                  f"({chosen_file.get('width')}x{chosen_file.get('height')})")
            break

    if not chosen_file or not chosen_file.get("link"):
        raise RuntimeError("İndirilebilir video dosyası bulunamadı.")

    dest = OUTPUT_DIR / f"{name}_bg.mp4"
    print(f"  İndiriliyor -> {dest}")
    _download(chosen_file["link"], dest)
    print(f"  Tamamlandi: {dest}")
    return dest
