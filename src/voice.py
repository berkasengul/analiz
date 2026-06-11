"""edge-tts ile Türkçe seslendirme ve SRT altyazı üretimi."""
import asyncio
import re
from pathlib import Path

import edge_tts

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output"

# Türkçe sesler: AhmetNeural (erkek) | EmelNeural (kadın)
VOICE = "tr-TR-AhmetNeural"
WORDS_PER_CUE = 8  # Her altyazı satırındaki kelime sayısı


def _vtt_to_srt(vtt: str) -> str:
    """WebVTT içeriğini SRT formatına dönüştürür."""
    # WEBVTT başlığını ve boş ilk satırları kaldır
    lines = vtt.splitlines()
    start = 0
    for i, line in enumerate(lines):
        if line.strip() == "WEBVTT":
            start = i + 1
            break

    body = "\n".join(lines[start:]).strip()

    # Timestamp noktalarını virgüle çevir (VTT → SRT)
    body = re.sub(
        r"(\d{2}:\d{2}:\d{2})\.(\d{3})",
        r"\1,\2",
        body,
    )

    # Blokları numaralandır
    blocks = [b.strip() for b in re.split(r"\n{2,}", body) if b.strip()]
    numbered = []
    for idx, block in enumerate(blocks, start=1):
        # NOTE satırlarını atla
        if block.startswith("NOTE"):
            continue
        numbered.append(f"{idx}\n{block}")

    return "\n\n".join(numbered) + "\n"


async def _synthesize_async(text: str, audio_path: Path, srt_path: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE)
    submaker = edge_tts.SubMaker()

    audio_path.parent.mkdir(parents=True, exist_ok=True)

    with open(audio_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                submaker.create_sub(
                    (chunk["offset"], chunk["duration"]),
                    chunk["text"],
                )

    vtt_content = submaker.generate_subs(words_in_cue=WORDS_PER_CUE)
    srt_content = _vtt_to_srt(vtt_content)
    srt_path.write_text(srt_content, encoding="utf-8")


def synthesize(script_text: str, name: str = "short") -> tuple[Path, Path]:
    """Verilen metni seslendirir ve SRT altyazı dosyası üretir.

    Args:
        script_text: Seslendirilecek metin.
        name: Çıktı dosyası temel adı (ör. 'short_1234567890').

    Returns:
        ``(audio_path, srt_path)`` — her ikisi de ``Path`` nesnesi.
    """
    audio_path = OUTPUT_DIR / f"{name}.mp3"
    srt_path = OUTPUT_DIR / f"{name}.srt"

    asyncio.run(_synthesize_async(script_text, audio_path, srt_path))

    print(f"  Ses: {audio_path}")
    print(f"  Altyazı: {srt_path}")
    return audio_path, srt_path
