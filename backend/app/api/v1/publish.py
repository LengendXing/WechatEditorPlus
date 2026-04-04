import re
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel
from premailer import transform

from app.core.config import settings
from app.core.response import success
from app.services import article_service, wechat_service

router = APIRouter(prefix="/publish", tags=["publish"])


class PublishDraftReq(BaseModel):
    article_id: str
    author: Optional[str] = ""
    digest: Optional[str] = ""


def _inline_css(html: str, css: str = "") -> str:
    """Convert <style> + class rules to inline style attributes.
    Also injects any separate CSS from the article's css field."""
    if css.strip():
        html = f"<style>{css}</style>{html}"

    # Wrap in a minimal HTML doc for premailer to parse correctly
    full = f"<html><head><meta charset='utf-8'></head><body>{html}</body></html>"
    result = transform(
        full,
        remove_classes=True,
        remove_unknown_selectors=False,
        keep_style_tags=False,
        strip_important=False,
        cssutils_logging_level="CRITICAL",
    )

    # Extract just the body content
    match = re.search(r"<body[^>]*>(.*)</body>", result, re.DOTALL)
    return match.group(1).strip() if match else result


def _sanitize_for_wechat(html: str) -> str:
    """Remove tags/attributes that WeChat doesn't support."""
    # Remove <style> tags (should already be gone after inline, but just in case)
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL | re.IGNORECASE)
    # Remove class attributes
    html = re.sub(r'\s+class="[^"]*"', "", html)
    html = re.sub(r"\s+class='[^']*'", "", html)
    # Remove id attributes (except those needed for SVG interactions)
    # html = re.sub(r'\s+id="[^"]*"', "", html)
    # Remove <script> tags
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    return html


@router.get("/html/{article_id}")
async def get_processed_html(article_id: str):
    """Get article HTML with CSS inlined — ready for copying to WeChat."""
    article = article_service.get_article(article_id)
    html = article.get("html", "")
    css = article.get("css", "")

    inlined = _inline_css(html, css)
    sanitized = _sanitize_for_wechat(inlined)

    return success({"html": sanitized, "css": "", "title": article.get("title", "")})


@router.post("/process")
async def process_article(req: PublishDraftReq):
    """Process article: inline CSS + replace local images with WeChat CDN URLs."""
    article = article_service.get_article(req.article_id)
    html = article.get("html", "")
    css = article.get("css", "")

    inlined = _inline_css(html, css)
    sanitized = _sanitize_for_wechat(inlined)
    processed = wechat_service.process_html_images(sanitized, settings.IMAGES_DIR)

    return success({"html": processed})


@router.post("/draft")
async def publish_draft(req: PublishDraftReq):
    """Push article to WeChat draft box with CSS inlined."""
    article = article_service.get_article(req.article_id)
    html = article.get("html", "")
    css = article.get("css", "")

    # 1. CSS inline 化
    inlined = _inline_css(html, css)
    sanitized = _sanitize_for_wechat(inlined)

    # 2. 图片上传到微信 CDN
    processed_html = wechat_service.process_html_images(sanitized, settings.IMAGES_DIR)

    # 3. 封面图
    cover_path = article.get("cover", "")
    thumb_media_id = ""
    if cover_path:
        from pathlib import Path
        local_cover = Path(settings.IMAGES_DIR) / cover_path.removeprefix("/images/")
        if local_cover.exists():
            thumb_media_id = wechat_service.upload_thumb_to_wechat(
                local_cover.read_bytes(), local_cover.name
            )

    if not thumb_media_id:
        match = re.search(r'src="([^"]+)"', processed_html)
        if match:
            src = match.group(1)
            try:
                import httpx
                resp_bytes = httpx.get(src, timeout=15).content
                thumb_media_id = wechat_service.upload_thumb_to_wechat(resp_bytes, "cover.jpg")
            except Exception:
                pass

    # 4. 推送草稿
    result = wechat_service.create_draft(
        title=article.get("title", "Untitled"),
        html=processed_html,
        author=req.author or article.get("author", ""),
        digest=req.digest or article.get("digest", ""),
        thumb_media_id=thumb_media_id,
    )
    return success(result)
