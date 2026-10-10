#!/usr/bin/env python3
"""Prepare approved terraFIBER photo originals as responsive, local WebP assets.

Usage:
    python -m pip install Pillow
    mkdir -p source_images
    # Copy all seven originals from the official gallery into source_images/
    python scripts/prepare_images.py

No HTTP downloads are performed. The script stops if any original is missing.
The HTML file is edited only after all seven files are checked successfully.
"""
from pathlib import Path
import re
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_images"
DEST = ROOT / "assets" / "images"
PAGE = ROOT / "index.html"
FILES = [
    "AVA-05573-235",
    "AVA-05532-215",
    "AVA-05521-211",
    "AVA-00131-69",
    "AVA-00024-14",
    "AVA-05398-164",
    "AVA-05497-198",
]

def main() -> None:
    inputs = [SOURCE / (base + "-scaled.jpg") for base in FILES]
    missing = [str(path) for path in inputs if not path.is_file()]
    if missing:
        raise SystemExit("FEHLENDE ORIGINALFOTOS / MISSING FILES:\n" + "\n".join(missing))
    html = PAGE.read_text(encoding="utf-8")
    output = {}
    for base, path in zip(FILES, inputs):
        with Image.open(path) as img:
            rgb = ImageOps.exif_transpose(img).convert("RGB")
            if rgb.width < 1600:
                raise SystemExit(f"{path.name}: original width {rgb.width}px < 1600px")
            output[base] = (rgb, rgb.width, rgb.height)
    DEST.mkdir(parents=True, exist_ok=True)
    for base, (rgb, orig_w, orig_h) in output.items():
        for width in (800, 1600):
            height = round(orig_h * width / orig_w)
            scaled = rgb.resize((width, height), Image.Resampling.LANCZOS)
            target = DEST / f"{base}-{width}.webp"
            scaled.save(target, "WEBP", quality=83, method=6)
            print(f"Created {target.relative_to(ROOT)} ({width}x{height})")

        url = f"https://terrafiber.de/wp-content/uploads/2025/12/{base}-scaled.jpg"
        local = f"/assets/images/{base}-800.webp"
        srcset = f'/assets/images/{base}-800.webp 800w, /assets/images/{base}-1600.webp 1600w'
        pattern = r'<img\b([^>]*?)\bsrc="' + re.escape(url) + r'"([^>]*)>'
        def rewrite(m):
            attrs = (m.group(1) + m.group(2)).replace(" />", " ").replace("/>", "")
            attrs = re.sub(r'\s+srcset="[^"]*"', "", attrs)
            attrs = re.sub(r'\s+sizes="[^"]*"', "", attrs)
            attrs = re.sub(r'\s+width="[^"]*"', "", attrs)
            attrs = re.sub(r'\s+height="[^"]*"', "", attrs)
            attrs = attrs.strip()
            sizes = "(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw"
            return f'<img src="{local}" srcset="{srcset}" sizes="{sizes}" width="{orig_w}" height="{orig_h}" {attrs}>'
        html, changed = re.subn(pattern, rewrite, html, count=1)
        if changed != 1:
            raise SystemExit(f"Expected one image tag for {base}, found {changed}")
    PAGE.write_text(html, encoding="utf-8")
    print("index.html now loads all seven photos locally with responsive srcset.")

if __name__ == "__main__":
    main()
