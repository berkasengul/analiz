"""Seslendirme: ElevenLabs, "Berkay" sesi, v4 modeli.

Gerekli: ELEVENLABS_API_KEY ortam değişkeni.
İsteğe bağlı: ELEVEN_VOICE (ses adı ya da voice_id, varsayılan "Berkay"),
             ELEVEN_MODEL (varsayılan: hesaptaki en yeni v4 modeli).

Akıcılık için:
- Her sahne, önceki ve sonraki sahnenin metniyle birlikte (previous_text /
  next_text) üretilir; böylece tonlama sahneler arasında kopmaz.
- Karakter zamanlamaları (with-timestamps) kaydedilir; ekrandaki yazılar ve
  altyazılar bu zamanlara göre senkronlanır.
"""
import base64
import json
import os
import subprocess
import sys
import time
from pathlib import Path

import requests

from script import SCENES

API = "https://api.elevenlabs.io"
KEY = os.environ.get("ELEVENLABS_API_KEY", "")
VOICE = os.environ.get("ELEVEN_VOICE", "Berkay")
MODEL = os.environ.get("ELEVEN_MODEL", "")
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "build") / "vo"

# Akıcı, belgesel tadında anlatım
SETTINGS = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35,
            "use_speaker_boost": True, "speed": 1.04}


def h():
    return {"xi-api-key": KEY}


def find_voice(name: str) -> str:
    if len(name) >= 20 and name.isalnum():
        return name
    r = requests.get(f"{API}/v2/voices", headers=h(), params={"search": name, "page_size": 100}, timeout=30)
    voices = r.json().get("voices", []) if r.ok else []
    if not voices:  # eski uç nokta
        voices = requests.get(f"{API}/v1/voices", headers=h(), timeout=30).json().get("voices", [])
    for v in voices:
        if v["name"].strip().lower() == name.lower():
            return v["voice_id"]
    for v in voices:
        if name.lower() in v["name"].lower():
            return v["voice_id"]
    sys.exit(f"'{name}' adlı ses bulunamadı. Mevcut sesler: {[v['name'] for v in voices]}")


def pick_model() -> str:
    if MODEL:
        return MODEL
    models = requests.get(f"{API}/v1/models", headers=h(), timeout=30).json()
    ids = [m["model_id"] for m in models if m.get("can_do_text_to_speech", True)]
    for pref in ("eleven_v4", "eleven_multilingual_v4", "eleven_v3", "eleven_multilingual_v2"):
        for mid in ids:
            if mid.startswith(pref):
                return mid
    v4 = [m for m in ids if "v4" in m]
    return v4[0] if v4 else ids[0]


def words_from_alignment(al: dict) -> list:
    """Karakter zamanlarını [başlangıç, süre, kelime] listesine çevirir."""
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur, t0, t1 = [], "", None, None
    for c, a, b in zip(chars, st, en):
        if c.isspace():
            if cur:
                words.append([t0, t1 - t0, cur])
            cur, t0 = "", None
            continue
        if t0 is None:
            t0 = a
        cur += c
        t1 = b
    if cur:
        words.append([t0, t1 - t0, cur])
    return words


def synth(i: int, text: str, prev: str, nxt: str, voice_id: str, model: str) -> None:
    mp3, js = OUT / f"{i:02d}.mp3", OUT / f"{i:02d}.json"
    if mp3.exists() and js.exists():
        meta = json.loads(js.read_text())
        if meta.get("text") == text and meta.get("voice") == voice_id and meta.get("model") == model:
            return
    body = {"text": text, "model_id": model, "voice_settings": SETTINGS,
            "language_code": "tr", "previous_text": prev, "next_text": nxt}
    for attempt in range(5):
        r = requests.post(f"{API}/v1/text-to-speech/{voice_id}/with-timestamps",
                          headers=h(), params={"output_format": "mp3_44100_192"}, json=body, timeout=180)
        if r.status_code == 400 and attempt == 0:
            # bazı modeller previous/next_text ya da language_code desteklemez
            for k in ("previous_text", "next_text", "language_code"):
                body.pop(k, None)
            continue
        if r.ok:
            break
        print("retry", i, r.status_code, r.text[:200])
        time.sleep(2 ** attempt)
    r.raise_for_status()
    d = r.json()
    mp3.write_bytes(base64.b64decode(d["audio_base64"]))
    al = d.get("normalized_alignment") or d.get("alignment")
    dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(mp3)]).strip())
    js.write_text(json.dumps({"text": text, "voice": voice_id, "model": model, "dur": dur,
                              "words": words_from_alignment(al) if al else []}, ensure_ascii=False))
    print(f"{i:02d} {dur:6.2f}s  {text[:60]}")


def main() -> None:
    if not KEY:
        sys.exit("ELEVENLABS_API_KEY tanımlı değil.")
    OUT.mkdir(parents=True, exist_ok=True)
    voice_id, model = find_voice(VOICE), pick_model()
    print("ses:", VOICE, voice_id, "| model:", model)
    idx = [i for i, s in enumerate(SCENES) if s["vo"].strip()]
    for k, i in enumerate(idx):
        prev = SCENES[idx[k - 1]]["vo"] if k > 0 else ""
        nxt = SCENES[idx[k + 1]]["vo"] if k + 1 < len(idx) else ""
        synth(i, SCENES[i]["vo"], prev, nxt, voice_id, model)


if __name__ == "__main__":
    main()
