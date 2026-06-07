#!/usr/bin/env python3
"""Upload grouped animal listing photos via the backend API."""

from __future__ import annotations

import io
import re
import subprocess
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

import pymysql
import requests
from PIL import Image

ASSETS_DIR = Path(
    "/Users/iremcelik/.cursor/projects/"
    "Users-iremcelik-Desktop-Need-Based-Animal-Adoption-Platform-main-2-"
    "Need-Based-Animal-Adoption-Platform-1/assets"
)
API_BASE = "http://127.0.0.1:8080"

DB = {
    "host": "monorail.proxy.rlwy.net",
    "port": 29128,
    "user": "root",
    "password": "BdnElCroOfUEQvHnRnBxDUIWVMWhVDLg",
    "database": "railway",
    "ssl": {"ssl": True},
}

# normalized name -> (animal_id, owner_id)
ANIMALS = {
    "badem": (8, 20),
    "bal": (18, 20),
    "benek": (26, 24),
    "gofret": (7, 20),
    "moka": (9, 20),
    "leyla": (21, 24),
    "max": (23, 24),
    "mico": (17, 20),
    "ringo": (25, 24),
    "pisi": (24, 24),
    "tarcin": (12, 20),
    "telve": (20, 24),
    "komur": (22, 24),
}

NAME_ALIASES = {
    "ko_mu_r": "komur",
    "mic_o": "mico",
    "pis_i": "pisi",
    "lila": "leyla",
}

FILENAME_RE = re.compile(
    r"^(.+)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$",
    re.IGNORECASE,
)
NUM_SUFFIX_RE = re.compile(r"^(.+?)(\d+)$", re.IGNORECASE)
SKIP_PREFIXES = ("ekran_resmi", "646cf9cf")


def normalize_key(raw: str) -> str | None:
    key = raw.strip().lower()
    key = NAME_ALIASES.get(key, key)
    return key if key in ANIMALS else None


def parse_filename(path: Path) -> tuple[str, int | None, str] | None:
    m = FILENAME_RE.match(path.name)
    if not m:
        return None
    stem = m.group(1)
    if stem.lower().startswith(SKIP_PREFIXES):
        return None
    num_match = NUM_SUFFIX_RE.match(stem)
    if num_match:
        raw_name, num = num_match.group(1), int(num_match.group(2))
    else:
        raw_name, num = stem, None
    key = normalize_key(raw_name)
    if not key:
        return None
    return key, num, stem


def sort_order(has_unnumbered: bool, num: int | None) -> int:
    if has_unnumbered:
        return 0 if num is None else num
    if num is None:
        return 0
    return num - 1


def png_to_jpeg_bytes(path: Path) -> bytes:
    with Image.open(path) as img:
        rgb = img.convert("RGB")
        buf = io.BytesIO()
        rgb.save(buf, format="JPEG", quality=90)
        return buf.getvalue()


def clear_existing_images(animal_ids: list[int]) -> None:
    if not animal_ids:
        return
    placeholders = ",".join(["%s"] * len(animal_ids))
    conn = pymysql.connect(**DB)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"DELETE FROM animal_images WHERE animal_id IN ({placeholders})",
                animal_ids,
            )
        conn.commit()
    finally:
        conn.close()


def upload_animal(animal_id: int, owner_id: int, ordered_paths: list[Path]) -> None:
    files = []
    handles = []
    try:
        for idx, path in enumerate(ordered_paths):
            jpeg = png_to_jpeg_bytes(path)
            fh = io.BytesIO(jpeg)
            fh.name = f"{path.stem}.jpg"
            handles.append(fh)
            files.append(("images", (fh.name, fh, "image/jpeg")))

        url = f"{API_BASE}/api/animals/{animal_id}/images"
        resp = requests.post(
            url,
            params={"viewerId": owner_id},
            files=files,
            timeout=120,
        )
        if not resp.ok:
            raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:300]}")
        payload = resp.json()
        urls = payload.get("urls") or []
        print(f"  uploaded {len(urls)} image(s)")
    finally:
        for fh in handles:
            fh.close()


def main() -> int:
    if not ASSETS_DIR.is_dir():
        print(f"Assets dir not found: {ASSETS_DIR}", file=sys.stderr)
        return 1

    grouped: dict[str, list[tuple[int | None, Path, str]]] = defaultdict(list)
    skipped = []

    for path in sorted(ASSETS_DIR.glob("*.png")):
        parsed = parse_filename(path)
        if not parsed:
            skipped.append(path.name)
            continue
        key, num, stem = parsed
        grouped[key].append((num, path, stem))

    # Prefer Leyla* over lila* when both map to the same slot.
    leyla_entries = grouped.get("leyla", [])
    leyla_numbers = {
        num for num, _, stem in leyla_entries if stem.lower().startswith("leyla") and num is not None
    }
    if leyla_numbers:
        grouped["leyla"] = [
            item
            for item in leyla_entries
            if not (item[2].lower().startswith("lila") and item[0] in leyla_numbers)
        ]

    plan: list[tuple[str, int, int, list[Path]]] = []
    for key, items in sorted(grouped.items()):
        animal_id, owner_id = ANIMALS[key]
        has_unnumbered = any(num is None for num, _, _ in items)
        ordered = sorted(
            ((sort_order(has_unnumbered, num), path) for num, path, _ in items),
            key=lambda x: x[0],
        )
        paths = [path for _, path in ordered]
        plan.append((key, animal_id, owner_id, paths))
        print(f"{key} (id={animal_id}, owner={owner_id}): {len(paths)} photo(s)")

    if not plan:
        print("No animal photos matched.", file=sys.stderr)
        return 1

    animal_ids = [animal_id for _, animal_id, _, _ in plan]
    print("\nClearing existing animal_images rows...")
    clear_existing_images(animal_ids)

    print("\nUploading...")
    for key, animal_id, owner_id, paths in plan:
        print(f"{key} -> animal {animal_id}")
        upload_animal(animal_id, owner_id, paths)

    if skipped:
        print(f"\nSkipped {len(skipped)} unrelated file(s).")

    print("\nDone.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
