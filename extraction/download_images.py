#!/usr/bin/env python3
"""
Image downloader for Orcas History project.
Reads URLs from the browser tab and downloads images immediately.
Run this after navigating to a photo batch page.
"""

import json
import os
import urllib.request
import sys
from pathlib import Path

IMAGES_DIR = Path(__file__).parent / "extraction/data/images"

def download_batch(start_num: int, urls: list[str]) -> dict:
    """Download a batch of images given starting number and URL list."""
    results = {"success": 0, "failed": [], "sizes": []}

    for i, url in enumerate(urls):
        photo_id = f"{start_num + i:04d}"
        filepath = IMAGES_DIR / f"{photo_id}.jpg"

        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                data = response.read()
                filepath.write_bytes(data)
                results["success"] += 1
                results["sizes"].append((photo_id, len(data)))
                print(f"  ✓ {photo_id}: {len(data):,} bytes")
        except Exception as e:
            results["failed"].append((photo_id, str(e)))
            print(f"  ✗ {photo_id}: {e}")

    return results

def main():
    if len(sys.argv) < 3:
        print("Usage: python download_images.py <start_num> <url1> <url2> ...")
        sys.exit(1)

    start_num = int(sys.argv[1])
    urls = sys.argv[2:]

    print(f"Downloading {len(urls)} images starting from {start_num:04d}...")
    results = download_batch(start_num, urls)

    print(f"\nResults: {results['success']}/{len(urls)} successful")
    if results["failed"]:
        print("Failed:")
        for photo_id, err in results["failed"]:
            print(f"  {photo_id}: {err}")

if __name__ == "__main__":
    main()
