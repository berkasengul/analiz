"""YouTube Data API v3 ile video yükleme (OAuth2)."""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

load_dotenv(Path(__file__).resolve().parents[1] / "config" / ".env")

_SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
_CONFIG_DIR = Path(__file__).resolve().parents[1] / "config"
_CLIENT_SECRET = _CONFIG_DIR / "client_secret.json"
_TOKEN_FILE = _CONFIG_DIR / "token.json"

_CATEGORY_EDUCATION = "27"   # Eğitim
_DEFAULT_PRIVACY = os.getenv("YT_PRIVACY", "public")  # public | unlisted | private


def _get_credentials() -> Credentials:
    """Kaydedilmiş token'ı yükler; yoksa OAuth akışı başlatır."""
    creds: Credentials | None = None

    if _TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(_TOKEN_FILE), _SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not _CLIENT_SECRET.exists():
                raise FileNotFoundError(
                    f"OAuth istemci sırrı bulunamadı: {_CLIENT_SECRET}\n"
                    "Google Cloud Console'dan indirip config/ klasörüne koyun."
                )
            flow = InstalledAppFlow.from_client_secrets_file(
                str(_CLIENT_SECRET), _SCOPES
            )
            creds = flow.run_local_server(port=0)

        _TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")

    return creds


def upload(
    video_path: Path,
    title: str,
    description: str,
    tags: list[str],
    privacy: str = _DEFAULT_PRIVACY,
) -> str:
    """Videoyu YouTube'a yükler.

    Args:
        video_path:  Yüklenecek MP4 dosyası.
        title:       Video başlığı (maks. 100 karakter).
        description: Video açıklaması (maks. 5000 karakter).
        tags:        Etiket listesi.
        privacy:     'public', 'unlisted' veya 'private'.

    Returns:
        Yüklenen videonun YouTube video ID'si.

    Raises:
        FileNotFoundError: client_secret.json eksikse.
        googleapiclient.errors.HttpError: API hatası.
    """
    creds = _get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    body = {
        "snippet": {
            "title": title[:100],
            "description": description[:5000],
            "tags": tags[:500],
            "categoryId": _CATEGORY_EDUCATION,
            "defaultLanguage": "tr",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(
        str(video_path),
        mimetype="video/mp4",
        resumable=True,
        chunksize=1024 * 1024 * 10,  # 10 MB chunk
    )

    request = youtube.videos().insert(
        part=",".join(body.keys()),
        body=body,
        media_body=media,
    )

    print(f"  Yükleniyor: {video_path.name}")
    response = None
    while response is None:
        try:
            status, response = request.next_chunk()
            if status:
                pct = int(status.progress() * 100)
                print(f"  %{pct} tamamlandı...", end="\r", flush=True)
        except HttpError as e:
            if e.resp.status in (500, 502, 503, 504):
                print(f"\n  Geçici hata ({e.resp.status}), yeniden deneniyor...")
                continue
            raise

    video_id = response.get("id", "?")
    print(f"\n  YouTube'a yüklendi: https://youtu.be/{video_id}")
    return video_id
