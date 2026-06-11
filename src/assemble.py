"""FFmpeg ile 9:16 Shorts videosu birleştirir: arka plan + ses + altyazı."""
import subprocess
import sys
from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output"

# Hedef çözünürlük (Shorts: 1080x1920)
WIDTH = 1080
HEIGHT = 1920

# Altyazı stili (FFmpeg ASS override)
_SUB_STYLE = (
    "FontName=Arial,"
    "FontSize=18,"
    "PrimaryColour=&H00FFFFFF,"
    "OutlineColour=&H00000000,"
    "Outline=2,"
    "Bold=1,"
    "Alignment=2,"
    "MarginV=80"
)


def _ffmpeg_path(p: Path) -> str:
    """Path'i FFmpeg subtitle filtresi için güvenli stringe çevirir.

    Windows'ta 'C:\\path' → 'C\\:/path' (FFmpeg filter-graph sözdizimi).
    """
    s = str(p).replace("\\", "/")
    # Drive harfinden sonraki ':' karakterini escape et
    if len(s) >= 2 and s[1] == ":":
        s = s[0] + "\\:" + s[2:]
    return s


def _get_duration(path: Path) -> float:
    """ffprobe ile dosyanın süresini saniye cinsinden döndürür."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True, text=True, check=True,
    )
    return float(result.stdout.strip())


def build(
    audio_path: Path,
    srt_path: Path,
    bg_video: Path,
    name: str = "short",
) -> Path:
    """Ses, altyazı ve arka plan videosunu birleştirerek Shorts videosu üretir.

    İşlem adımları:
    1. Arka plan video, ses süresine tamamlanana kadar döngüye alınır.
    2. 1080x1920 (9:16) crop + scale uygulanır.
    3. SRT altyazılar yakılır.
    4. Ses eklenir.

    Args:
        audio_path: Seslendirme MP3 dosyası.
        srt_path:   SRT altyazı dosyası.
        bg_video:   Arka plan video dosyası.
        name:       Çıktı dosyası temel adı.

    Returns:
        Oluşturulan video dosyasının ``Path`` nesnesi.

    Raises:
        subprocess.CalledProcessError: FFmpeg başarısız olursa.
        FileNotFoundError: FFmpeg kurulu değilse.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"{name}.mp4"

    audio_dur = _get_duration(audio_path)
    bg_dur = _get_duration(bg_video)

    # Kaç kez döngüye almak gerektiğini hesapla (en az 1)
    loop_count = max(1, int(audio_dur / bg_dur) + 1)

    sub_filter = (
        f"subtitles={_ffmpeg_path(srt_path)}"
        f":force_style='{_SUB_STYLE}'"
    )

    video_filter = (
        # 1) Döngü için setpts sıfırla
        f"scale={WIDTH * 2}:{HEIGHT * 2}:force_original_aspect_ratio=increase,"
        f"crop={WIDTH}:{HEIGHT},"
        f"{sub_filter}"
    )

    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", str(loop_count),
        "-i", str(bg_video),
        "-i", str(audio_path),
        "-vf", video_filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        "-t", str(audio_dur),   # ses bitince dur
        "-movflags", "+faststart",
        str(out_path),
    ]

    print(f"  FFmpeg komutu çalıştırılıyor ({audio_dur:.1f}s)...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print("  [FFmpeg stderr]:", result.stderr[-2000:], file=sys.stderr)
        result.check_returncode()

    print(f"  Video hazır: {out_path}")
    return out_path
