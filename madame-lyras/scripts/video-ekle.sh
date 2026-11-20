#!/usr/bin/env bash
# Videoyu siteye hazırlar: en fazla 8 sn, sessiz, kısa kenarı 720 px, H.264 (hızlı başlatma); ilk kareyi webp olarak kaydeder.
# Kullanım: scripts/video-ekle.sh <video.mp4> <ürün-id> [başlangıç-sn]
# Sonra src/data.js içindeki VIDEOS listesine ürün id'sini ekleyin.
set -euo pipefail
src="$1"; id="$2"; ss="${3:-0}"; out="public/video"
mkdir -p "$out"
ffmpeg -loglevel error -y -ss "$ss" -i "$src" -t 8 -an -vf "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)',fps=30" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart "$out/$id.mp4"
ffmpeg -loglevel error -y -i "$out/$id.mp4" -frames:v 1 -q:v 80 "$out/$id.webp"
ls -la "$out/$id.mp4" "$out/$id.webp"
