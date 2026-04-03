from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.response import success
from app.services import article_service

router = APIRouter(prefix="/articles", tags=["articles"])


class CreateArticleReq(BaseModel):
    title: str
    mode: str = "html"


class UpdateArticleReq(BaseModel):
    title: Optional[str] = None
    mode: Optional[str] = None
    html: Optional[str] = None
    css: Optional[str] = None
    js: Optional[str] = None
    markdown: Optional[str] = None
    cover: Optional[str] = None
    author: Optional[str] = None
    digest: Optional[str] = None


@router.post("")
async def create_article(req: CreateArticleReq):
    article = article_service.create_article(req.title, req.mode)
    return success(article)


@router.get("")
async def list_articles():
    return success(article_service.list_articles())


@router.get("/{article_id}")
async def get_article(article_id: str):
    return success(article_service.get_article(article_id))


@router.put("/{article_id}")
async def update_article(article_id: str, req: UpdateArticleReq):
    article = article_service.update_article(article_id, req.model_dump(exclude_none=True))
    return success(article)


@router.delete("/{article_id}")
async def delete_article(article_id: str):
    article_service.delete_article(article_id)
    return success(message="deleted")
