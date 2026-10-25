#!/usr/bin/env python3
"""Cuts logos out of their white backgrounds (alpha from whiteness), trims them and
writes transparent WebP into public/media/logos/. Requires numpy and pillow.
Sources live in assets-src/logos/."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src/logos"
OUT = ROOT / "public/media/logos"
OUT.mkdir(parents=True, exist_ok=True)


def cut_out(path: Path, height: int) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    alpha = 255 - rgb.min(axis=2)  # white -> 0, saturated or dark -> opaque
    a = np.clip(alpha / 255, 1e-3, 1)[..., None]
    color = np.clip((rgb - 255 * (1 - a)) / a, 0, 255)  # un-premultiply against white
    rgba = np.dstack([color, alpha]).astype(np.uint8)
    img = Image.fromarray(rgba)
    img = img.crop(img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
    img = img.resize((round(img.width * height / img.height), height), Image.LANCZOS)
    return img


for name, height in (("eth", 200), ("alps", 180)):
    img = cut_out(SRC / f"{name}.jpg", height)
    img.save(OUT / f"{name}.webp", quality=86, method=6)
    print(name, img.size)

