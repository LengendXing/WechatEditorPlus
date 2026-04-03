import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.config import settings
from app.core.exceptions import AppError


def _articles_dir() -> Path:
    return Path(settings.ARTICLES_DIR)


def _article_path(article_id: str) -> Path:
    return _articles_dir() / f"{article_id}.json"


def create_article(title: str, mode: str = "html") -> dict:
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
    article["updated_at"] = datetime.now(timezone.utc).isoformat()
    _article_path(article_id).write_text(json.dumps(article, ensure_ascii=False), encoding="utf-8")
    return article


def delete_article(article_id: str) -> None:
    path = _article_path(article_id)
    if not path.exists():
        raise AppError(code=404, message=f"Article {article_id} not found")
    path.unlink()


def list_articles() -> list[dict]:
    articles = []
    for f in sorted(_articles_dir().glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
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
        except (json.JSONDecodeError, KeyError):
            continue
    return articles
