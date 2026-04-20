import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import article_service


@pytest.fixture(autouse=True)
def _isolate_article_storage(tmp_path, monkeypatch):
    from app.core import config as config_mod

    monkeypatch.setattr(config_mod.settings, "ARTICLES_DIR", str(tmp_path / "articles"))
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_markdown_updates_compile_html_for_api_callers(client: TestClient):
    created = client.post("/api/v1/articles", json={"title": "Markdown", "mode": "markdown"})
    article_id = created.json()["data"]["id"]

    updated = client.put(
        f"/api/v1/articles/{article_id}",
        json={"mode": "markdown", "markdown": "# Hello\n\nBody copy"},
    )

    assert updated.status_code == 200
    payload = updated.json()["data"]
    assert payload["markdown"] == "# Hello\n\nBody copy"
    assert "<h1>Hello</h1>" in payload["html"]
    assert "<p>Body copy</p>" in payload["html"]


def test_explicit_html_wins_over_markdown_auto_compile(client: TestClient):
    created = client.post("/api/v1/articles", json={"title": "Hybrid", "mode": "markdown"})
    article_id = created.json()["data"]["id"]

    updated = client.put(
        f"/api/v1/articles/{article_id}",
        json={
            "mode": "markdown",
            "markdown": "# Hello\n\nBody copy",
            "html": "<section><h1>Custom</h1><p>Trusted HTML</p></section>",
        },
    )

    assert updated.status_code == 200
    payload = updated.json()["data"]
    assert payload["html"] == "<section><h1>Custom</h1><p>Trusted HTML</p></section>"


def test_list_articles_skips_files_deleted_mid_scan(tmp_path, monkeypatch):
    from app.core import config as config_mod

    articles_dir = tmp_path / "articles"
    articles_dir.mkdir(parents=True)
    monkeypatch.setattr(config_mod.settings, "ARTICLES_DIR", str(articles_dir))

    stable = articles_dir / "stable.json"
    stable.write_text(
        '{"id":"stable","title":"Stable","mode":"html","cover":"","created_at":"2026-04-20T00:00:00+00:00","updated_at":"2026-04-20T00:00:00+00:00"}',
        encoding="utf-8",
    )

    transient = articles_dir / "transient.json"
    transient.write_text(
        '{"id":"transient","title":"Transient","mode":"html","cover":"","created_at":"2026-04-20T00:00:00+00:00","updated_at":"2026-04-20T00:00:00+00:00"}',
        encoding="utf-8",
    )

    original_read_text = article_service.Path.read_text

    def flaky_read_text(self, *args, **kwargs):
        if self == transient:
            transient.unlink(missing_ok=True)
            raise FileNotFoundError(transient)
        return original_read_text(self, *args, **kwargs)

    monkeypatch.setattr(article_service.Path, "read_text", flaky_read_text)

    articles = article_service.list_articles()

    assert [item["id"] for item in articles] == ["stable"]
