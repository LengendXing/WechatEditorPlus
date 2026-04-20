import pytest
from fastapi.testclient import TestClient

from app.main import app


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
