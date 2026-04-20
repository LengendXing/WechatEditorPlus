"""Record the 36-second MBEditor promo as a webm using Playwright.

Run with: python scripts/record_promo.py
Requires: the static promo server running on http://127.0.0.1:7077/.
"""
from __future__ import annotations

import shutil
import time
from pathlib import Path

from playwright.sync_api import sync_playwright


RECORD_DIR = Path("docs/promo/_recording")
OUTPUT = Path("docs/promo/promo.webm")
WIDTH = 1280
HEIGHT = 720
DURATION_SECONDS = 38  # 36s content + buffer


def main() -> None:
    RECORD_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": WIDTH, "height": HEIGHT},
            record_video_dir=str(RECORD_DIR),
            record_video_size={"width": WIDTH, "height": HEIGHT},
            device_scale_factor=1,
        )
        page = context.new_page()
        page.goto("http://127.0.0.1:7077/index.html", wait_until="networkidle")

        # Switch to the 宣传片 tab so the promo Stage mounts and auto-plays.
        page.evaluate(
            """() => {
                const el = Array.from(document.querySelectorAll('button, a, div'))
                    .find(n => n.textContent?.trim() === '宣传片');
                el?.click();
            }"""
        )

        # Give the stage a beat to mount and start its timeline.
        page.wait_for_timeout(800)

        # Record straight through without touching the page — any extra DOM work
        # tends to pause the Stage or throttle rAF in headless mode.
        time.sleep(DURATION_SECONDS)

        page.close()
        context.close()
        browser.close()

    # Move the recorded file into a stable location.
    recordings = sorted(RECORD_DIR.glob("*.webm"))
    if not recordings:
        raise SystemExit("no webm produced by playwright")
    latest = recordings[-1]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(latest), str(OUTPUT))
    shutil.rmtree(RECORD_DIR, ignore_errors=True)

    size_mb = OUTPUT.stat().st_size / (1024 * 1024)
    print(f"wrote {OUTPUT} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
