#!/usr/bin/env python3
"""Download existing approved terraFIBER gallery originals and create local WebP.

Usage: python scripts/prepare_images.py --download
Produces two image sizes (800px and 1600px) and updates DE and EN HTML.
All files are validated before either HTML page is modified.
Original JPEGs are temporary and should not be committed.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import re
from urllib.request import Request, urlopen

from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source_images"
DEST = ROOT / "assets" / "images"
PAGES = [ROOT / "index.html", ROOT / "en" / "index.html"]
BASE = "https://terrafiber.de/wp-content/uploads/2025/12/"
FILES = [
    "AVA-05573-235", "AVA-05532-215", "AVA-05521-211",
    "AVA-00131-69", "AVA-00024-14", "AVA-05398-164",
    "AVA-05497-198",
]


def get_source(base: str, download: bool) -> Path:
    path = SOURCE / f"{base}-scaled.jpg"
    if path.is_file() and path.stat().st_size > 10000:
        return path
    if not download:
        raise RuntimeError(f"Missing original: {path}")
    url = BASE + f"{base}-scaled.jpg"
    request = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; terraFIBER-asset-migration/1.0)",
        "Accept": "image/avif,image/webp,image/jpeg,image/*;q=0.8",
        "Referer": "https://terrafiber.de/gallery/",
    })
    with urlopen(request, timeout=35) as response:
        data = response.read(18 * 1024 * 1024 + 1)
    if not 10000 < len(data) < 18 * 1024 * 1024:
        raise ValueError(f"Unexpected image size for {base}: {len(data)} bytes")
    SOURCE.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    print(f"Downloaded {path.name}: {len(data):,} bytes")
    return path


def convert(download: bool) -> None:
    originals = {}
    for name in FILES:
        path = get_source(name, download)
        try:
            with Image.open(path) as img:
                img.verify()
            with Image.open(path) as img:
                rgb = ImageOps.exif_transpose(img).convert("RGB")
        except (OSError, UnidentifiedImageError) as exc:
            raise RuntimeError(f"Invalid image {path.name}") from exc
        if rgb.width < 1600:
            raise RuntimeError(f"Original {path.name} is too small: {rgb.size}")
        originals[name] = rgb
    # Preflight: both pages must reference each input before making any changes.
    html = {path: path.read_text(encoding="utf-8") for path in PAGES}
    for path, document in html.items():
        for name in FILES:
            if (BASE + name + "-scaled.jpg") not in document:
                raise RuntimeError(f"Original link not found in {path}: {name}")

    DEST.mkdir(parents=True, exist_ok=True)
    for name, image in originals.items():
        for width in (800, 1600):
            height = round(image.height * width / image.width)
            out = DEST / f"{name}-{width}.webp"
            image.resize((width, height), Image.Resampling.LANCZOS).save(
                out, "WEBP", quality=82, method=6
            )
            print(f"WebP: {out.relative_to(ROOT)} — {out.stat().st_size:,} bytes")

    for path, document in html.items():
        for name, image in originals.items():
            src = BASE + name + "-scaled.jpg"
            local = f"/assets/images/{name}-800.webp"
            srcset = (f"/assets/images/{name}-800.webp 800w, "
                      f"/assets/images/{name}-1600.webp 1600w")
            regex = r'<img\b([^>]*?)\bsrc="' + re.escape(src) + r'"([^>]*)>'
            def rewrite(match):
                attrs = (match.group(1) + match.group(2)).strip().rstrip("/").strip()
                attrs = re.sub(r'\s+(?:srcset|sizes|width|height)="[^"]*"', "", attrs)
                # Default for half-width editorial images and gallery; optimized for full-bleed later.
                sizes = "(max-width: 700px) 100vw, (max-width: 1100px) 65vw, 50vw"
                height = round(image.height * 1600 / image.width)
                return (f'<img src="{local}" srcset="{srcset}" sizes="{sizes}" '
                        f'width="1600" height="{height}" {attrs}>')
            document, count = re.subn(regex, rewrite, document)
            if count < 1:
                raise RuntimeError(f"Image missing in {path}: {name}")
        # The full-width photo strip should request a full-width WebP.
        document = re.sub(
            r'(<section class="site-photo-band"[^>]*><img\b[^>]*?)'
            r'sizes="[^"]*"',
            r'\1sizes="100vw"',
            document,
            count=1
        )
        path.write_text(document, encoding="utf-8")
        print(f"Updated {path.relative_to(ROOT)}")

    for document in html:
        assert "https://terrafiber.de/wp-content/uploads/" not in document.read_text("utf-8")
    print("Successfully migrated both DE and EN pages to local WebP images.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true")
    opts = parser.parse_args()
    convert(opts.download)
