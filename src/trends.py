"""Google Trends ve YouTube RSS'ten trend konuları çeker."""
import random
import requests
import feedparser
from pytrends.request import TrendReq

# YouTube Trending RSS (API key gerektirmez)
_YT_RSS_URL = (
    "https://www.youtube.com/feeds/videos.xml"
    "?chart=mostpopular&regionCode=TR&hl=tr&maxResults=10"
)

_FALLBACK_TOPICS = [
    "yapay zeka nedir",
    "uzay keşfi son dakika",
    "sağlıklı yaşam ipuçları",
    "para kazanma yolları",
    "teknoloji haberleri",
    "dünya rekoru kıran olaylar",
    "bilim insanlarından şaşırtıcı keşifler",
    "tarihte bugün ne oldu",
    "doğa olayları",
    "gelecekte bizi neler bekliyor",
]


def _google_trends(count: int) -> list[str]:
    try:
        pytrends = TrendReq(hl="tr-TR", tz=180, timeout=(10, 25), retries=2)
        df = pytrends.trending_searches(pn="turkey")
        topics = df[0].dropna().tolist()
        return [str(t).strip() for t in topics if t][:count]
    except Exception as exc:
        print(f"  [trends] Google Trends hatası: {exc}")
        return []


def _youtube_rss(count: int) -> list[str]:
    try:
        feed = feedparser.parse(_YT_RSS_URL)
        titles = [entry.get("title", "") for entry in feed.entries if entry.get("title")]
        return titles[:count]
    except Exception as exc:
        print(f"  [trends] YouTube RSS hatası: {exc}")
        return []


def get_topics(count: int = 5) -> list[str]:
    """Trend konuları döndürür.

    Önce Google Trends, sonra YouTube RSS, ikisi de başarısız olursa
    karıştırılmış yedek liste kullanılır.

    Args:
        count: Döndürülecek konu sayısı.

    Returns:
        Konu dizelerinin listesi (en az 1 eleman, en fazla ``count``).
    """
    topics: list[str] = []

    print("  Google Trends sorgulanıyor...")
    topics = _google_trends(count * 2)

    if len(topics) < count:
        print("  YouTube RSS sorgulanıyor...")
        topics += _youtube_rss(count * 2)

    # Tekrarları kaldır, sırayı koru
    seen: set[str] = set()
    unique: list[str] = []
    for t in topics:
        if t.lower() not in seen:
            seen.add(t.lower())
            unique.append(t)

    if not unique:
        print("  Yedek konu listesi kullanılıyor...")
        unique = random.sample(_FALLBACK_TOPICS, min(count, len(_FALLBACK_TOPICS)))

    return unique[:count]
