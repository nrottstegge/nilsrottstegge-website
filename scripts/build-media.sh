#!/usr/bin/env bash
# Builds web media from the original research assets (which are only read).
# Requires ffmpeg with libx264, libsvtav1 and libwebp.
#   AT   Adaptive_Trees repository        PDE  PDE homework-8 folder
#   GPU  JSC GPU course slide master (GH200 photo)
set -euo pipefail
AT=${AT:-$HOME/Documents/Studium/JSC/git-repos/Adaptive_Trees}
PDE=${PDE:-$HOME/Documents/Studium/ETH_Zuerich/Informatik/Bachelor/7_Semester/PDEs/homework-8}
GPU=${GPU:-$HOME/Documents/Studium/JSC/GPU_course/GSP-GPU/01-Basics/slides/slides/gpu-slide-master}
OUT=$(cd "$(dirname "$0")/.." && pwd)/public/media
mkdir -p "$OUT/projects" "$OUT/logos"
ff() { ffmpeg -v error -y "$@"; }

# Muted project loops (AV1 + H.264) and a poster frame.
loop() { # name, source, filter, poster frame
  ff -i "$2" -vf "$3,format=yuv420p" -c:v libsvtav1 -crf 42 -preset 4 -an -movflags +faststart "$OUT/projects/$1.av1.mp4"
  ff -i "$2" -vf "$3,format=yuv420p" -c:v libx264 -preset slow -crf 29 -an -movflags +faststart "$OUT/projects/$1.h264.mp4"
  ff -i "$2" -vf "select=eq(n\,$4),$3" -frames:v 1 -c:v libwebp -quality 78 "$OUT/projects/$1.webp"
}
# Flyby: crop away the burned-in labels, upscale with lanczos, denoise, sharpen.
loop adaptive-trees "$AT/docs/slides/public/gifs/flyby.mp4" \
  "crop=779:438:90:44,hqdn3d=1.2:1.2:0:0,scale=640:360:flags=lanczos,cas=0.4" 70
loop coulomb-explosion "$AT/docs/slides/public/gifs/coulomb_explosion.mp4" \
  "crop=700:440:100:50,scale=640:400:flags=lanczos,cas=0.35" 40
loop porous-convection "$PDE/animation.gif" "fps=12,crop=896:448:123:72,scale=800:400:flags=lanczos" 60

# GH200 photo for the HPCG tile (NVIDIA press image used in the JSC GPU course; has alpha).
ff -i "$GPU/020-Platform/img/gh200.png" -vf "scale=1200:-2:flags=lanczos" -c:v libwebp -quality 82 "$OUT/projects/gh200.webp"

# Logos available locally (ETH and ALPS come from assets-src/, see build-logos.py).
ff -i "$AT/docs/report/public/jupiter-logo.png" -vf "scale=128:128:flags=lanczos" -c:v libwebp -quality 90 "$OUT/logos/jupiter.webp"
cp "$AT/docs/slides/public/fzj.svg" "$OUT/logos/fzj.svg"

# Interactive 3D tree viewers (self-contained vtk.js exports from the report). The
# exports set a favicon on kitware.github.io; point it at the site's own icon so loading a
# viewer makes no third-party request.
mkdir -p "$OUT/viewer"
for n in 9 8 6; do
  sed 's#https://kitware.github.io/vtk-js/icon/favicon-${t}x${t}.png#../../icon.svg#' \
    "$AT/docs/report/public/viewer/scene-export-$n.html" > "$OUT/viewer/scene-$n.html"
done
