"""Tüm pipeline'ı sırayla çalıştırır."""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

import trends, script, voice, visuals, assemble, upload  # noqa: E402


def run(topic=None, do_upload=False):
    name = f"short_{int(time.time())}"
    print(f"\n=== Yeni Short: {name} ===")

    # 1. Trend / konu
    if not topic:
        print("[1/6] Trend araştırılıyor...")
        topic = trends.get_topics(count=5)[0]
    print(f"  Seçilen konu: {topic}")

    # 2. Script
    print("[2/6] Script üretiliyor...")
    data = script.generate(topic)

    # 3. Ses
    print("[3/6] Seslendiriliyor...")
    audio_path, srt_path = voice.synthesize(data["script"], name=name)

    # 4. Görsel
    print("[4/6] Arka plan videosu çekiliyor...")
    bg = visuals.fetch_video(topic, name=name)

    # 5. Montaj
    print("[5/6] Video birleştiriliyor...")
    video_path = assemble.build(audio_path, srt_path, bg_video=bg, name=name)

    # meta kaydet
    (video_path.with_suffix(".json")).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    # 6. Yükle
    if do_upload:
        print("[6/6] YouTube'a yükleniyor...")
        upload.upload(video_path, data["title"], data["description"], data["tags"])
    else:
        print("[6/6] Yükleme atlandı (--all ile yükleyebilirsin)")

    print(f"\n✓ Tamamlandı: {video_path}")
    return video_path


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--topic", help="Belirli bir konu (boşsa trend seçilir)")
    p.add_argument("--all", action="store_true", help="Üret + YouTube'a yükle")
    p.add_argument("--count", type=int, default=1, help="Kaç Short üretilsin")
    args = p.parse_args()

    for i in range(args.count):
        if args.count > 1:
            print(f"\n########## {i+1}/{args.count} ##########")
        run(topic=args.topic, do_upload=args.all)
