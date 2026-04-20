import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import AppError
from app.services.renderers.markdown_renderer import render_markdown_source


def _articles_dir() -> Path:
    return Path(settings.ARTICLES_DIR)


def _article_path(article_id: str) -> Path:
    return _articles_dir() / f"{article_id}.json"


def _article_mtime(path: Path) -> float:
    try:
        return path.stat().st_mtime
    except OSError:
        return float("-inf")


def create_article(title: str, mode: str = "html") -> dict:
    _articles_dir().mkdir(parents=True, exist_ok=True)
    article_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()
    article = {
        "id": article_id,
        "title": title,
        "mode": mode,
        "html": "",
        "css": "",
        "js": "",
        "markdown": "",
        "cover": "",
        "author": "",
        "digest": "",
        "created_at": now,
        "updated_at": now,
    }
    _article_path(article_id).write_text(json.dumps(article, ensure_ascii=False), encoding="utf-8")
    return article


def get_article(article_id: str) -> dict:
    path = _article_path(article_id)
    if not path.exists():
        raise AppError(code=404, message=f"Article {article_id} not found")
    return json.loads(path.read_text(encoding="utf-8"))


def update_article(article_id: str, updates: dict) -> dict:
    article = get_article(article_id)
    allowed = {"title", "mode", "html", "css", "js", "markdown", "cover", "author", "digest"}
    for key, value in updates.items():
        if key in allowed and value is not None:
            article[key] = value

    # API and CLI callers often send only Markdown; keep stored HTML in sync
    # so preview/publish routes can work without a frontend-side compiler.
    if article.get("mode") == "markdown" and "markdown" in updates and "html" not in updates:
        article["html"] = render_markdown_source(article.get("markdown", ""))

    article["updated_at"] = datetime.now(timezone.utc).isoformat()
    _article_path(article_id).write_text(json.dumps(article, ensure_ascii=False), encoding="utf-8")
    return article


def delete_article(article_id: str) -> None:
    path = _article_path(article_id)
    if not path.exists():
        raise AppError(code=404, message=f"Article {article_id} not found")
    path.unlink()


def list_articles() -> list[dict]:
    _articles_dir().mkdir(parents=True, exist_ok=True)
    articles = []
    for f in sorted(_articles_dir().glob("*.json"), key=_article_mtime, reverse=True):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            articles.append({
                "id": data["id"],
                "title": data["title"],
                "mode": data["mode"],
                "cover": data.get("cover", ""),
                "created_at": data["created_at"],
                "updated_at": data["updated_at"],
            })
        except (OSError, json.JSONDecodeError, KeyError):
            continue
    return articles
