from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.services.showcase_seed import seed_showcase_templates_if_empty


@pytest.fixture(autouse=True)
def _isolate_articles(tmp_path, monkeypatch):
    from app.core import config as config_mod

    monkeypatch.setattr(config_mod.settings, "ARTICLES_DIR", str(tmp_path / "articles"))
    yield


def test_seeds_five_templates_when_dir_is_empty():
    count = seed_showcase_templates_if_empty()
    assert count == 5

    from app.core import config as config_mod

    articles = sorted(Path(config_mod.settings.ARTICLES_DIR).glob("*.json"))
    assert len(articles) == 5
    titles = [json.loads(a.read_text(encoding="utf-8"))["title"] for a in articles]
    # All five showcase template titles must appear, regardless of seed order.
    for needle in ("极简商务", "科技霓虹", "活力撞色", "文艺手札", "杂志专栏"):
        assert any(needle in t for t in titles), f"missing template: {needle} — got {titles}"


def test_skips_when_articles_dir_has_content(tmp_path, monkeypatch):
    from app.core import config as config_mod

    existing = Path(config_mod.settings.ARTICLES_DIR)
    existing.mkdir(parents=True, exist_ok=True)
    (existing / "existing.json").write_text(
        json.dumps({
            "id": "existing",
            "title": "user's own",
            "mode": "html",
            "html": "",
            "css": "",
            "js": "",
            "markdown": "",
            "cover": "",
            "author": "",
            "digest": "",
            "created_at": "2026-04-20T00:00:00+00:00",
            "updated_at": "2026-04-20T00:00:00+00:00",
        }),
        encoding="utf-8",
    )

    count = seed_showcase_templates_if_empty()
    assert count == 0
    # User's own article must be untouched.
    assert (existing / "existing.json").exists()
    assert len(list(existing.glob("*.json"))) == 1


def test_handles_missing_templates_gracefully(tmp_path, monkeypatch):
    from app.services import showcase_seed

    monkeypatch.setattr(showcase_seed, "_templates_dir", lambda: None)

    count = showcase_seed.seed_showcase_templates_if_empty()
    assert count == 0
