"""Claude API ile YouTube Shorts metni, başlığı ve meta verisi üretir."""
import json
import os
import re
from pathlib import Path

import anthropic
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / "config" / ".env")

_CLIENT = None  # lazy init


def _client() -> anthropic.Anthropic:
    global _CLIENT
    if _CLIENT is None:
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise EnvironmentError(
                "ANTHROPIC_API_KEY bulunamadı. config/.env dosyasına ekleyin."
            )
        _CLIENT = anthropic.Anthropic(api_key=api_key)
    return _CLIENT


_SYSTEM = (
    "Sen bir YouTube Shorts içerik yazarısın. "
    "Verilen konuyu izleyiciyi ilk 3 saniyede yakalayan, "
    "merak uyandıran, Türkçe kısa bir video senaryosuna dönüştürürsün. "
    "Yanıtını YALNIZCA geçerli JSON olarak ver, başka hiçbir şey yazma."
)

_USER_TMPL = """\
Konu: {topic}

Aşağıdaki JSON şemasını doldur:
{{
  "script": "<seslendirilecek Türkçe metin, 120-180 kelime, hook cümlesiyle başlar>",
  "title": "<YouTube başlığı, maksimum 90 karakter, emoji kullan>",
  "description": "<YouTube açıklama, 300-400 karakter, hashtag içerir>",
  "tags": ["<etiket1>", "<etiket2>", "..."]
}}

Kurallar:
- Script yalnızca seslendirilecek metin içermeli (yön notları yok).
- Tags dizisi 10-15 Türkçe/İngilizce etiket içermeli.
- Sadece JSON döndür, markdown kod bloğu bile kullanma.
"""


def _extract_json(text: str) -> dict:
    """Model yanıtından JSON nesnesini ayıklar."""
    # Markdown kod bloğu temizle
    text = re.sub(r"```(?:json)?", "", text).strip()
    # İlk { ... } bloğunu al
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        raise ValueError(f"Yanıtta JSON bulunamadı:\n{text[:500]}")
    return json.loads(m.group())


def generate(topic: str) -> dict:
    """Verilen konu için script ve meta veri üretir.

    Args:
        topic: Araştırılacak / anlatılacak konu.

    Returns:
        Anahtarları ``script``, ``title``, ``description``, ``tags`` olan dict.

    Raises:
        EnvironmentError: API anahtarı eksikse.
        ValueError: Model geçersiz JSON döndürürse.
    """
    prompt = _USER_TMPL.format(topic=topic)
    response = _client().messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text
    data = _extract_json(raw)

    # Şema doğrulama
    for key in ("script", "title", "description", "tags"):
        if key not in data:
            raise ValueError(f"Eksik alan: '{key}'. Ham yanıt:\n{raw[:500]}")

    if not isinstance(data["tags"], list):
        data["tags"] = [str(data["tags"])]

    return data
