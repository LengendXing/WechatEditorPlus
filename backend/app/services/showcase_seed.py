"""First-run seeding of the five V5 showcase articles.

Runs idempotently on every backend boot. When the articles directory is empty,
load the bundled templates under ``docs/cli/examples/templates/tpl_*.json`` and
stamp them into storage so the article list has content on first open.

Skipping conditions:
- ARTICLES_DIR already has at least one article file (users get to curate).
- Templates directory missing (e.g. stripped-down deployment).
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from app.core.config import settings


logger = logging.getLogger(__name__)


def _articles_dir() -> Path:
    return Path(settings.ARTICLES_DIR)


def _templates_dir() -> Path | None:
    # Template resolution, in preference order:
    # 1. ``backend/app/seeds/`` — bundled inside the backend image for Docker.
    # 2. ``<repo>/docs/cli/examples/templates/`` — available when running from
    #    the source tree (dev mode, uv run, etc.).
    here = Path(__file__).resolve()
    candidates: list[Path] = [here.parent.parent / "seeds"]
    for parents in (3, 4, 5):
        try:
            candidates.append(here.parents[parents] / "docs" / "cli" / "examples" / "templates")
        except IndexError:
            break
    for path in candidates:
        if path.is_dir() and any(path.glob("tpl_*.json")):
            return path
    return None


def _iter_template_files(directory: Path) -> Iterable[Path]:
    # Stable seed order by filename so first/last timestamps match README copy.
    return sorted(directory.glob("tpl_*.json"))


def seed_showcase_templates_if_empty() -> int:
    """Return the number of articles written (``0`` if the dir was non-empty)."""
    articles_dir = _articles_dir()
    articles_dir.mkdir(parents=True, exist_ok=True)
    if any(articles_dir.glob("*.json")):
        return 0

    templates_dir = _templates_dir()
    if templates_dir is None:
        logger.info("Showcase templates not found — skipping first-run seed.")
        return 0

    seeded = 0
    now = datetime.now(timezone.utc)
    for index, template_path in enumerate(_iter_template_files(templates_dir)):
        try:
            raw = json.loads(template_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("Skipping broken template %s: %s", template_path.name, exc)
            continue

        article_id = uuid.uuid4().hex[:12]
        # Space timestamps 5 min apart so sort-by-updated preserves listing order.
        stamp = now.replace(microsecond=0).isoformat()
        article = {
            "id": article_id,
            "title": raw.get("title") or template_path.stem,
            "mode": raw.get("mode", "html"),
            "html": raw.get("html", ""),
            "css": raw.get("css", ""),
            "js": raw.get("js", ""),
            "markdown": raw.get("markdown", ""),
            "cover": raw.get("cover", ""),
            "author": raw.get("author", ""),
            "digest": raw.get("digest", ""),
            "created_at": stamp,
            "updated_at": stamp,
        }
        out = articles_dir / f"{article_id}.json"
        out.write_text(json.dumps(article, ensure_ascii=False), encoding="utf-8")
        seeded += 1
        # Advance so the next iteration has a fresh second-resolution timestamp
        # even when the filesystem clock is slow.
        now = now.replace(microsecond=0)

    if seeded:
        logger.info("Seeded %d showcase articles into %s", seeded, articles_dir)
    return seeded
