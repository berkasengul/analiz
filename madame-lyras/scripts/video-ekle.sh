#!/usr/bin/env bash
# Higgsfield videosunu siteye hazırlar: sıkıştırır (H.264, sessiz, ~720 px), ilk kareyi görsel olarak kaydeder.
# Kullanım: scripts/video-ekle.sh <indirilen-video.mp4> <ürün-id>   (ör. scripts/video-ekle.sh ~/Downloads/cilek.mp4 cilek)
# Sonra src/data.js içindeki VIDEOS listesine ürün id'sini ekleyin.
set -euo pipefail
src="$1"; id="$2"; out="public/video"
mkdir -p "$out"
ffmpeg -y -i "$src" -an -vf "scale=-2:960,fps=30" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart "$out/$id.mp4"
ffmpeg -y -i "$out/$id.mp4" -frames:v 1 -q:v 80 "$out/$id.webp"
ls -la "$out/$id.mp4" "$out/$id.webp"
