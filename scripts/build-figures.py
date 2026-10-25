#!/usr/bin/env python3
"""Crops the HBDIA figure (no-JS fallback) from the bachelor-thesis presentation into WebP. Requires pymupdf, pillow.

Usage: python3 scripts/build-figures.py [PRESENTATION_PDF]
"""
import io
import sys
from pathlib import Path

import fitz
from PIL import Image

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() /
           "Documents/Studium/ETH_Zuerich/Informatik/Bachelor/6_Semester/BA/Bachelor_thesis_presentation_Rottstegge_Nils.pdf")
OUT = Path(__file__).resolve().parent.parent / "public/media/projects"
OUT.mkdir(parents=True, exist_ok=True)

# name: (page, clip rectangle in PDF points on the 960 x 540 slide)
FIGURES = {
    "hbdia": (14, (24, 82, 936, 461)),        # dense -> DIA -> blocks -> GPU / CPU
}

doc = fitz.open(SRC)
for name, (page, clip) in FIGURES.items():
    pix = doc[page - 1].get_pixmap(matrix=fitz.Matrix(2.5, 2.5), clip=fitz.Rect(*clip))
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    img.thumbnail((1400, 1400))
    img.save(OUT / f"{name}.webp", quality=84, method=6)
    print(name, img.size)
