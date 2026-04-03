# 微信公众号编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WeChat Official Account HTML editor/preview tool deployed on NAS via Docker, with image hosting, rich-text copy, WeChat API integration, and Agent skill.

**Architecture:** Three-tier — React 19 frontend (Monaco Editor + preview), Python FastAPI backend (image hosting + WeChat API proxy + article storage), Docker Compose deployment. Agent interaction via curl-based SKILL.md.

**Tech Stack:** React 19, Tailwind CSS v4, Vite, Monaco Editor, juice, marked, highlight.js, Python FastAPI, httpx, Docker

---

## File Structure

```
D:/Web/wechat-editor/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── router.tsx
│       ├── index.css
│       ├── lib/
│       │   └── api.ts
│       ├── types/
│       │   └── index.ts
│       ├── utils/
│       │   ├── inliner.ts
│       │   ├── sanitizer.ts
│       │   └── markdown.ts
│       ├── hooks/
│       │   ├── useClipboard.ts
│       │   ├── useImageUpload.ts
│       │   └── useAutoSave.ts
│       ├── components/
│       │   ├── ui/
│       │   │   └── Button.tsx
│       │   ├── layout/
│       │   │   └── MainLayout.tsx
│       │   ├── editor/
│       │   │   ├── MonacoEditor.tsx
│       │   │   ├── MarkdownEditor.tsx
│       │   │   └── EditorTabs.tsx
│       │   ├── preview/
│       │   │   └── WechatPreview.tsx
│       │   └── panel/
│       │       ├── ActionPanel.tsx
│       │       ├── ImageManager.tsx
│       │       └── ThemeSelector.tsx
│       └── pages/
│           ├── Editor.tsx
│           ├── ArticleList.tsx
│           └── Settings.tsx
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py
│       │   ├── response.py
│       │   └── exceptions.py
│       ├── api/v1/
│       │   ├── __init__.py
│       │   ├── router.py
│       │   ├── articles.py
│       │   ├── images.py
│       │   ├── wechat.py
│       │   └── publish.py
│       └── services/
│           ├── __init__.py
│           ├── article_service.py
│           ├── image_service.py
│           └── wechat_service.py
├── data/
│   ├── images/
│   ├── articles/
│   └── config.json
└── skill/
    └── SKILL.md
```

---

### Task 1: 项目脚手架 — 后端基础

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/response.py`
- Create: `backend/app/core/exceptions.py`
- Create: `backend/app/main.py`
- Create: `backend/app/api/__init__.py`
- Create: `backend/app/api/v1/__init__.py`
- Create: `backend/app/api/v1/router.py`
- Create: `backend/app/services/__init__.py`
- Create: `backend/requirements.txt`
- Create: `backend/Dockerfile`

- [ ] **Step 1: Create requirements.txt**

```
fastapi
uvicorn[standard]
python-multipart
pydantic-settings
Pillow
httpx
aiofiles
cryptography
```

- [ ] **Step 2: Create core/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
    IMAGES_DIR: str = "/app/data/images"
    ARTICLES_DIR: str = "/app/data/articles"
    CONFIG_FILE: str = "/app/data/config.json"

    model_config = {"env_prefix": ""}


settings = Settings()
```

- [ ] **Step 3: Create core/response.py**

```python
from typing import Any


def success(data: Any = None, message: str = "success") -> dict:
    return {"code": 0, "message": message, "data": data}


def fail(code: int = 1, message: str = "error", data: Any = None) -> dict:
    return {"code": code, "message": message, "data": data}
```

- [ ] **Step 4: Create core/exceptions.py**

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.response import fail


class AppError(Exception):
    def __init__(self, code: int = 1, message: str = "error"):
        self.code = code
        self.message = message
        super().__init__(message)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=200,
            content=fail(code=exc.code, message=exc.message),
        )

    @app.exception_handler(Exception)
    async def global_error_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content=fail(code=500, message=str(exc)),
        )
```

- [ ] **Step 5: Create api/v1/router.py (empty shell)**

```python
from fastapi import APIRouter

api_router = APIRouter(prefix="/api/v1")
```

- [ ] **Step 6: Create main.py**

```python
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.response import fail

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.IMAGES_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.ARTICLES_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("Data directories ensured.")
    yield
    logger.info("Application shutdown complete.")


app = FastAPI(title="WeChat Editor API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


@app.middleware("http")
async def check_upload_size(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_UPLOAD_SIZE:
            return JSONResponse(
                status_code=413,
                content=fail(code=413, message="Request body too large."),
            )
    return await call_next(request)


app.mount("/images", StaticFiles(directory=settings.IMAGES_DIR), name="images")

app.include_router(api_router)
```

- [ ] **Step 7: Create empty __init__.py files**

Create empty files at:
- `backend/app/__init__.py`
- `backend/app/core/__init__.py`
- `backend/app/api/__init__.py`
- `backend/app/api/v1/__init__.py`
- `backend/app/services/__init__.py`

- [ ] **Step 8: Create Dockerfile**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 9: Verify backend starts**

```bash
cd D:/Web/wechat-editor/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001
# Expected: INFO: Uvicorn running on http://0.0.0.0:8001
# Ctrl+C to stop
```

- [ ] **Step 10: Commit**

```bash
cd D:/Web/wechat-editor
git init
git add backend/
git commit -m "feat: backend scaffold with FastAPI core"
```

---

### Task 2: 文章 CRUD — 后端 API

**Files:**
- Create: `backend/app/services/article_service.py`
- Create: `backend/app/api/v1/articles.py`
- Modify: `backend/app/api/v1/router.py`

- [ ] **Step 1: Create article_service.py**

```python
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
```

- [ ] **Step 2: Create api/v1/articles.py**

```python
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
```

- [ ] **Step 3: Register articles router**

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.articles import router as articles_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(articles_router)
```

- [ ] **Step 4: Test articles API manually**

```bash
cd D:/Web/wechat-editor/backend
python -m uvicorn app.main:app --port 8001 &

# Create
curl -X POST http://localhost:8001/api/v1/articles -H "Content-Type: application/json" -d "{\"title\":\"test\",\"mode\":\"html\"}"
# Expected: {"code":0,"message":"success","data":{"id":"...","title":"test",...}}

# List
curl http://localhost:8001/api/v1/articles
# Expected: {"code":0,"data":[{"id":"...","title":"test",...}]}

# Update
curl -X PUT http://localhost:8001/api/v1/articles/{id} -H "Content-Type: application/json" -d "{\"html\":\"<h1>hello</h1>\"}"
# Expected: {"code":0,"data":{...,"html":"<h1>hello</h1>",...}}

# Delete
curl -X DELETE http://localhost:8001/api/v1/articles/{id}
# Expected: {"code":0,"message":"deleted"}
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/article_service.py backend/app/api/v1/articles.py backend/app/api/v1/router.py
git commit -m "feat: article CRUD API"
```

---

### Task 3: 图床服务 — 后端 API

**Files:**
- Create: `backend/app/services/image_service.py`
- Create: `backend/app/api/v1/images.py`
- Modify: `backend/app/api/v1/router.py`

- [ ] **Step 1: Create image_service.py**

```python
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

from app.core.config import settings
from app.core.exceptions import AppError


def _images_dir() -> Path:
    return Path(settings.IMAGES_DIR)


def _index_path() -> Path:
    return _images_dir() / "_index.json"


def _load_index() -> list[dict]:
    path = _index_path()
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _save_index(index: list[dict]) -> None:
    _index_path().write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")


def upload_image(filename: str, content: bytes) -> dict:
    md5 = hashlib.md5(content).hexdigest()
    ext = Path(filename).suffix.lower() or ".png"
    now = datetime.now(timezone.utc)
    date_dir = now.strftime("%Y/%m/%d")

    dest_dir = _images_dir() / date_dir
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_file = dest_dir / f"{md5}{ext}"

    # dedup
    index = _load_index()
    for item in index:
        if item["md5"] == md5:
            return item

    dest_file.write_bytes(content)

    # get dimensions
    try:
        with Image.open(dest_file) as img:
            width, height = img.size
    except Exception:
        width, height = 0, 0

    record = {
        "id": md5,
        "md5": md5,
        "filename": filename,
        "path": f"{date_dir}/{md5}{ext}",
        "size": len(content),
        "width": width,
        "height": height,
        "created_at": now.isoformat(),
    }
    index.append(record)
    _save_index(index)
    return record


def list_images() -> list[dict]:
    return list(reversed(_load_index()))


def delete_image(image_id: str) -> None:
    index = _load_index()
    found = None
    for item in index:
        if item["id"] == image_id:
            found = item
            break
    if not found:
        raise AppError(code=404, message=f"Image {image_id} not found")

    file_path = _images_dir() / found["path"]
    if file_path.exists():
        file_path.unlink()

    index = [i for i in index if i["id"] != image_id]
    _save_index(index)
```

- [ ] **Step 2: Create api/v1/images.py**

```python
from fastapi import APIRouter, UploadFile, File

from app.core.response import success
from app.services import image_service

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    content = await file.read()
    record = image_service.upload_image(file.filename or "image.png", content)
    return success(record)


@router.get("")
async def list_images():
    return success(image_service.list_images())


@router.delete("/{image_id}")
async def delete_image(image_id: str):
    image_service.delete_image(image_id)
    return success(message="deleted")
```

- [ ] **Step 3: Register images router**

```python
# backend/app/api/v1/router.py — add:
from app.api.v1.images import router as images_router

api_router.include_router(images_router)
```

- [ ] **Step 4: Test image upload**

```bash
# Upload
curl -X POST http://localhost:8001/api/v1/images/upload -F "file=@some_test_image.png"
# Expected: {"code":0,"data":{"id":"...","md5":"...","path":"2026/04/04/xxx.png",...}}

# List
curl http://localhost:8001/api/v1/images
# Expected: {"code":0,"data":[...]}

# Dedup test: upload same file again
curl -X POST http://localhost:8001/api/v1/images/upload -F "file=@some_test_image.png"
# Expected: same id/md5 as first upload
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/image_service.py backend/app/api/v1/images.py backend/app/api/v1/router.py
git commit -m "feat: image hosting service with MD5 dedup"
```

---

### Task 4: 微信 API 服务 — 后端

**Files:**
- Create: `backend/app/services/wechat_service.py`
- Create: `backend/app/api/v1/wechat.py`
- Create: `backend/app/api/v1/publish.py`
- Modify: `backend/app/api/v1/router.py`

- [ ] **Step 1: Create wechat_service.py**

```python
import json
import re
import time
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.exceptions import AppError

_token_cache: dict = {"access_token": "", "expires_at": 0}
_wx_image_cache: dict[str, str] = {}  # local_path -> wechat_url


def _config_path() -> Path:
    return Path(settings.CONFIG_FILE)


def load_config() -> dict:
    path = _config_path()
    if not path.exists():
        return {"appid": "", "appsecret": ""}
    return json.loads(path.read_text(encoding="utf-8"))


def save_config(appid: str, appsecret: str) -> dict:
    config = {"appid": appid, "appsecret": appsecret}
    path = _config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, ensure_ascii=False), encoding="utf-8")
    _token_cache["access_token"] = ""
    _token_cache["expires_at"] = 0
    return config


def _get_access_token() -> str:
    if _token_cache["access_token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["access_token"]

    config = load_config()
    if not config.get("appid") or not config.get("appsecret"):
        raise AppError(code=400, message="WeChat AppID/AppSecret not configured")

    resp = httpx.get(
        "https://api.weixin.qq.com/cgi-bin/token",
        params={
            "grant_type": "client_credential",
            "appid": config["appid"],
            "secret": config["appsecret"],
        },
        timeout=10,
    )
    data = resp.json()
    if "access_token" not in data:
        raise AppError(code=500, message=f"WeChat token error: {data.get('errmsg', 'unknown')}")

    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 7200) - 300
    return _token_cache["access_token"]


def upload_image_to_wechat(image_bytes: bytes, filename: str) -> str:
    token = _get_access_token()
    resp = httpx.post(
        f"https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token={token}",
        files={"media": (filename, image_bytes, "image/png")},
        timeout=30,
    )
    data = resp.json()
    if "url" not in data:
        raise AppError(code=500, message=f"WeChat upload error: {data.get('errmsg', 'unknown')}")
    return data["url"]


def upload_thumb_to_wechat(image_bytes: bytes, filename: str) -> str:
    """Upload thumb image as permanent material, returns media_id for draft cover."""
    token = _get_access_token()
    resp = httpx.post(
        f"https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={token}&type=thumb",
        files={"media": (filename, image_bytes, "image/jpeg")},
        timeout=30,
    )
    data = resp.json()
    if "media_id" not in data:
        raise AppError(code=500, message=f"WeChat thumb upload error: {data.get('errmsg', 'unknown')}")
    return data["media_id"]


def process_html_images(html: str, images_dir: str) -> str:
    """Replace local image URLs with WeChat CDN URLs."""

    def replace_src(match: re.Match) -> str:
        src = match.group(1)
        if "mmbiz.qpic.cn" in src:
            return match.group(0)
        if src in _wx_image_cache:
            return f'src="{_wx_image_cache[src]}"'

        # resolve local path
        local_path = None
        if src.startswith("/images/"):
            local_path = Path(images_dir) / src.removeprefix("/images/")
        elif src.startswith("http"):
            # download external image
            try:
                resp = httpx.get(src, timeout=15)
                img_bytes = resp.content
                fname = src.split("/")[-1].split("?")[0] or "image.png"
                wx_url = upload_image_to_wechat(img_bytes, fname)
                _wx_image_cache[src] = wx_url
                return f'src="{wx_url}"'
            except Exception:
                return match.group(0)

        if local_path and local_path.exists():
            img_bytes = local_path.read_bytes()
            fname = local_path.name
            wx_url = upload_image_to_wechat(img_bytes, fname)
            _wx_image_cache[src] = wx_url
            return f'src="{wx_url}"'

        return match.group(0)

    return re.sub(r'src="([^"]+)"', replace_src, html)


def create_draft(title: str, html: str, author: str = "", digest: str = "", thumb_media_id: str = "") -> dict:
    token = _get_access_token()

    if not thumb_media_id:
        raise AppError(code=400, message="Draft requires a cover image (thumb_media_id)")

    article = {
        "title": title,
        "author": author,
        "digest": digest,
        "content": html,
        "thumb_media_id": thumb_media_id,
        "content_source_url": "",
        "need_open_comment": 0,
        "only_fans_can_comment": 0,
    }

    resp = httpx.post(
        f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={token}",
        json={"articles": [article]},
        timeout=30,
    )
    data = resp.json()
    if "media_id" not in data:
        raise AppError(code=500, message=f"WeChat draft error: {data.get('errmsg', 'unknown')}")
    return {"media_id": data["media_id"]}
```

- [ ] **Step 2: Create api/v1/wechat.py**

```python
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.response import success
from app.services import wechat_service

router = APIRouter(prefix="/config", tags=["config"])


class ConfigReq(BaseModel):
    appid: str
    appsecret: str


@router.get("")
async def get_config():
    config = wechat_service.load_config()
    masked = {
        "appid": config.get("appid", ""),
        "appsecret": "****" + config.get("appsecret", "")[-4:] if config.get("appsecret") else "",
        "configured": bool(config.get("appid") and config.get("appsecret")),
    }
    return success(masked)


@router.put("")
async def update_config(req: ConfigReq):
    wechat_service.save_config(req.appid, req.appsecret)
    return success(message="saved")
```

- [ ] **Step 3: Create api/v1/publish.py**

```python
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.core.response import success
from app.services import article_service, wechat_service

router = APIRouter(prefix="/publish", tags=["publish"])


class PublishDraftReq(BaseModel):
    article_id: str
    author: Optional[str] = ""
    digest: Optional[str] = ""


@router.get("/html/{article_id}")
async def get_processed_html(article_id: str):
    """Get inline-CSS processed HTML for copying. Image URL replacement only if WeChat API configured."""
    article = article_service.get_article(article_id)
    html = article.get("html", "")
    css = article.get("css", "")

    # Return raw HTML + CSS for frontend to do juice inline processing
    return success({"html": html, "css": css, "title": article.get("title", "")})


@router.post("/process")
async def process_article(req: PublishDraftReq):
    """Process article: replace local images with WeChat CDN URLs."""
    article = article_service.get_article(req.article_id)
    html = article.get("html", "")

    processed_html = wechat_service.process_html_images(html, settings.IMAGES_DIR)

    return success({"html": processed_html})


@router.post("/draft")
async def publish_draft(req: PublishDraftReq):
    """Push article to WeChat draft box."""
    article = article_service.get_article(req.article_id)
    html = article.get("html", "")

    # Process images
    processed_html = wechat_service.process_html_images(html, settings.IMAGES_DIR)

    # Upload cover as thumb
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
        # Use first image in article as fallback cover
        import re
        match = re.search(r'src="([^"]+)"', processed_html)
        if match:
            src = match.group(1)
            try:
                resp_bytes = __import__("httpx").get(src, timeout=15).content
                thumb_media_id = wechat_service.upload_thumb_to_wechat(resp_bytes, "cover.jpg")
            except Exception:
                pass

    result = wechat_service.create_draft(
        title=article.get("title", "Untitled"),
        html=processed_html,
        author=req.author or article.get("author", ""),
        digest=req.digest or article.get("digest", ""),
        thumb_media_id=thumb_media_id,
    )
    return success(result)
```

- [ ] **Step 4: Register all new routers**

```python
# backend/app/api/v1/router.py
from fastapi import APIRouter

from app.api.v1.articles import router as articles_router
from app.api.v1.images import router as images_router
from app.api.v1.wechat import router as wechat_router
from app.api.v1.publish import router as publish_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(articles_router)
api_router.include_router(images_router)
api_router.include_router(wechat_router)
api_router.include_router(publish_router)
```

- [ ] **Step 5: Test config API**

```bash
# Set config
curl -X PUT http://localhost:8001/api/v1/config -H "Content-Type: application/json" -d "{\"appid\":\"test_id\",\"appsecret\":\"test_secret\"}"
# Expected: {"code":0,"message":"saved"}

# Get config
curl http://localhost:8001/api/v1/config
# Expected: {"code":0,"data":{"appid":"test_id","appsecret":"****cret","configured":true}}
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/wechat_service.py backend/app/api/v1/wechat.py backend/app/api/v1/publish.py backend/app/api/v1/router.py
git commit -m "feat: WeChat API service + publish + config endpoints"
```

---

### Task 5: 前端脚手架

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/vite-env.d.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/router.tsx`
- Create: `frontend/src/components/layout/MainLayout.tsx`
- Create: `frontend/Dockerfile`
- Create: `frontend/nginx.conf`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "wechat-editor-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.468.0",
    "@monaco-editor/react": "^4.7.0",
    "monaco-editor": "^0.52.0",
    "juice": "^11.0.0",
    "marked": "^15.0.0",
    "highlight.js": "^11.11.0",
    "dompurify": "^3.2.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/dompurify": "^3.2.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/images": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WeChat Editor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create src/index.css**

```css
@import "tailwindcss";

@theme {
  --color-surface-primary: #0A0A0A;
  --color-surface-secondary: #1A1A1A;
  --color-surface-tertiary: #252525;

  --color-fg-primary: #FFFFFF;
  --color-fg-secondary: #A1A1AA;
  --color-fg-muted: #71717A;

  --color-accent: #A855F7;
  --color-accent-hover: #9333EA;
  --color-accent-subtle: oklch(0.541 0.281 293.009 / 0.1);

  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  --color-border: #2A2A2A;

  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
  --radius-full: 9999px;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background-color: var(--color-surface-primary);
  color: var(--color-fg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 6: Create src/types/index.ts**

```typescript
export interface Article {
  id: string;
  title: string;
  mode: "html" | "markdown";
  html: string;
  css: string;
  js: string;
  markdown: string;
  cover: string;
  author: string;
  digest: string;
  created_at: string;
  updated_at: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  mode: string;
  cover: string;
  created_at: string;
  updated_at: string;
}

export interface ImageRecord {
  id: string;
  md5: string;
  filename: string;
  path: string;
  size: number;
  width: number;
  height: number;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
```

- [ ] **Step 7: Create src/lib/api.ts**

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 8: Create src/main.tsx, App.tsx, vite-env.d.ts**

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// src/App.tsx
import { RouterProvider } from "react-router-dom";
import router from "./router";

export default function App() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 9: Create router.tsx with placeholder pages**

```typescript
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <div className="p-8 text-fg-secondary">Select or create an article</div> },
      { path: "editor/:id", element: <div>Editor placeholder</div> },
      { path: "settings", element: <div>Settings placeholder</div> },
    ],
  },
]);

export default router;
```

- [ ] **Step 10: Create MainLayout.tsx**

```tsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Plus, Settings, FileText } from "lucide-react";

export default function MainLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen">
      <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-surface-secondary shrink-0">
        <Link to="/" className="flex items-center gap-2 text-fg-primary font-semibold">
          <FileText size={18} />
          <span>WeChat Editor</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 rounded-lg hover:bg-surface-tertiary text-fg-secondary hover:text-fg-primary transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 11: Create nginx.conf and Dockerfile**

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }

    location /images/ {
        proxy_pass http://backend:8000/images/;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 12: Install dependencies and verify dev server starts**

```bash
cd D:/Web/wechat-editor/frontend
npm install
npm run dev
# Expected: VITE vX.X.X ready in XXms, Local: http://localhost:5173/
# Ctrl+C to stop
```

- [ ] **Step 13: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffold with React 19 + Tailwind v4 + Vite"
```

---

### Task 6: 编辑器核心 — Monaco + Tabs + 预览

**Files:**
- Create: `frontend/src/components/editor/MonacoEditor.tsx`
- Create: `frontend/src/components/editor/EditorTabs.tsx`
- Create: `frontend/src/components/preview/WechatPreview.tsx`
- Create: `frontend/src/utils/inliner.ts`
- Create: `frontend/src/utils/sanitizer.ts`
- Create: `frontend/src/pages/Editor.tsx`
- Modify: `frontend/src/router.tsx`

- [ ] **Step 1: Create utils/inliner.ts**

```typescript
import juice from "juice";

const WX_TAG_WHITELIST = new Set([
  "section", "p", "span", "img", "strong", "em", "b", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "blockquote", "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "td", "th",
  "br", "hr", "pre", "code", "a", "sub", "sup",
  "figure", "figcaption",
]);

const WX_ATTR_WHITELIST = new Set([
  "style", "src", "href", "alt", "width", "height",
  "colspan", "rowspan", "target",
]);

export function inlineCSS(html: string, css: string): string {
  if (!css.trim()) return html;
  const wrapped = `<style>${css}</style>${html}`;
  return juice(wrapped, { removeStyleTags: true, preserveImportant: true });
}

export function sanitizeForWechat(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  function walk(node: Node): void {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      // Replace non-whitelisted tags with section
      if (!WX_TAG_WHITELIST.has(tag)) {
        const replacement = doc.createElement("section");
        replacement.innerHTML = el.innerHTML;
        const style = el.getAttribute("style");
        if (style) replacement.setAttribute("style", style);
        el.replaceWith(replacement);
        walk(replacement);
        return;
      }

      // Remove non-whitelisted attributes
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (!WX_ATTR_WHITELIST.has(attr.name)) {
          el.removeAttribute(attr.name);
        }
      }

      // Walk children
      Array.from(el.childNodes).forEach(walk);
    }
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

export function processForWechat(html: string, css: string): string {
  const inlined = inlineCSS(html, css);
  return sanitizeForWechat(inlined);
}
```

- [ ] **Step 2: Create components/editor/MonacoEditor.tsx**

```tsx
import Editor from "@monaco-editor/react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
}

export default function MonacoEditor({ value, onChange, language, height = "100%" }: MonacoEditorProps) {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "var(--font-mono)",
        lineNumbers: "on",
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        padding: { top: 12 },
      }}
    />
  );
}
```

- [ ] **Step 3: Create components/editor/EditorTabs.tsx**

```tsx
interface EditorTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
}

export default function EditorTabs({ activeTab, onTabChange, tabs }: EditorTabsProps) {
  return (
    <div className="flex border-b border-border bg-surface-secondary">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "text-accent border-b-2 border-accent"
              : "text-fg-muted hover:text-fg-secondary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create components/preview/WechatPreview.tsx**

```tsx
import { useMemo } from "react";
import { processForWechat } from "@/utils/inliner";

interface WechatPreviewProps {
  html: string;
  css: string;
  js: string;
  mode: "raw" | "wechat";
}

export default function WechatPreview({ html, css, js, mode }: WechatPreviewProps) {
  const srcDoc = useMemo(() => {
    if (mode === "raw") {
      return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body style="margin:0;padding:16px;font-family:-apple-system,sans-serif;">${html}
<script>${js}<\/script></body></html>`;
    }
    // wechat mode: inline CSS + sanitize
    const processed = processForWechat(html, css);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body{margin:0;padding:16px;font-family:-apple-system,sans-serif;font-size:16px;line-height:1.8;color:#333;}</style>
</head><body>${processed}</body></html>`;
  }, [html, css, js, mode]);

  return (
    <div className="h-full flex flex-col">
      <div className="mx-auto w-full max-w-[414px] h-full border border-border rounded-xl overflow-hidden bg-white">
        <div className="h-6 bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400">{mode === "raw" ? "原始预览" : "公众号效果"}</span>
        </div>
        <iframe
          srcDoc={srcDoc}
          className="w-full flex-1 border-0"
          style={{ height: "calc(100% - 24px)" }}
          sandbox="allow-scripts"
          title="preview"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create pages/Editor.tsx**

```tsx
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import MonacoEditor from "@/components/editor/MonacoEditor";
import EditorTabs from "@/components/editor/EditorTabs";
import WechatPreview from "@/components/preview/WechatPreview";
import api from "@/lib/api";
import type { Article } from "@/types";

const HTML_TABS = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "js", label: "JS" },
];

const LANG_MAP: Record<string, string> = { html: "html", css: "css", js: "javascript" };

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState("html");
  const [previewMode, setPreviewMode] = useState<"raw" | "wechat">("wechat");

  // Load article
  useEffect(() => {
    if (!id) return;
    api.get(`/articles/${id}`).then((res) => {
      if (res.data.code === 0) setArticle(res.data.data);
    });
  }, [id]);

  // Auto-save with debounce
  const saveTimer = { current: null as ReturnType<typeof setTimeout> | null };
  const autoSave = useCallback(
    (updated: Article) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        api.put(`/articles/${updated.id}`, {
          html: updated.html,
          css: updated.css,
          js: updated.js,
          markdown: updated.markdown,
          title: updated.title,
        });
      }, 3000);
    },
    []
  );

  const updateField = (field: keyof Article, value: string) => {
    if (!article) return;
    const updated = { ...article, [field]: value };
    setArticle(updated);
    autoSave(updated);
  };

  if (!article) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const editorValue = article[activeTab as keyof Article] as string || "";

  return (
    <div className="h-full flex flex-col">
      {/* Title bar */}
      <div className="h-10 border-b border-border flex items-center px-4 bg-surface-secondary shrink-0">
        <input
          value={article.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="bg-transparent text-fg-primary text-sm font-medium outline-none flex-1"
          placeholder="文章标题..."
        />
        <div className="flex gap-1">
          <button
            onClick={() => setPreviewMode("raw")}
            className={`px-2 py-1 text-xs rounded ${previewMode === "raw" ? "bg-accent text-white" : "text-fg-muted hover:text-fg-secondary"}`}
          >
            原始
          </button>
          <button
            onClick={() => setPreviewMode("wechat")}
            className={`px-2 py-1 text-xs rounded ${previewMode === "wechat" ? "bg-accent text-white" : "text-fg-muted hover:text-fg-secondary"}`}
          >
            微信
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <EditorTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={HTML_TABS} />
          <div className="flex-1">
            <MonacoEditor
              value={editorValue}
              onChange={(v) => updateField(activeTab as keyof Article, v)}
              language={LANG_MAP[activeTab] || "html"}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="w-[460px] shrink-0 p-4 bg-surface-primary overflow-y-auto">
          <WechatPreview
            html={article.html}
            css={article.css}
            js={article.js}
            mode={previewMode}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update router.tsx**

```typescript
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "./components/layout/MainLayout";

const Editor = lazy(() => import("./pages/Editor"));
const ArticleList = lazy(() => import("./pages/ArticleList"));
const Settings = lazy(() => import("./pages/Settings"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <LazyPage><ArticleList /></LazyPage> },
      { path: "editor/:id", element: <LazyPage><Editor /></LazyPage> },
      { path: "settings", element: <LazyPage><Settings /></LazyPage> },
    ],
  },
]);

export default router;
```

- [ ] **Step 7: Create placeholder ArticleList.tsx**

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, Trash2 } from "lucide-react";
import api from "@/lib/api";
import type { ArticleSummary } from "@/types";

export default function ArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);

  const load = () => {
    api.get("/articles").then((res) => {
      if (res.data.code === 0) setArticles(res.data.data);
    });
  };

  useEffect(() => { load(); }, []);

  const createArticle = async () => {
    const res = await api.post("/articles", { title: "未命名文章", mode: "html" });
    if (res.data.code === 0) {
      navigate(`/editor/${res.data.data.id}`);
    }
  };

  const deleteArticle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.delete(`/articles/${id}`);
    load();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">文章列表</h1>
        <button
          onClick={createArticle}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 新建文章
        </button>
      </div>

      {articles.length === 0 ? (
        <div className="text-center text-fg-muted py-20">暂无文章，点击上方按钮创建</div>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <div
              key={a.id}
              onClick={() => navigate(`/editor/${a.id}`)}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-secondary hover:bg-surface-tertiary cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-fg-muted" />
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-fg-muted mt-0.5">
                    {a.mode.toUpperCase()} · {new Date(a.updated_at).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => deleteArticle(a.id, e)}
                className="p-2 rounded-lg hover:bg-surface-primary text-fg-muted hover:text-error transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Create placeholder Settings.tsx**

```tsx
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function Settings() {
  const [appid, setAppid] = useState("");
  const [appsecret, setAppsecret] = useState("");
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/config").then((res) => {
      if (res.data.code === 0) {
        const d = res.data.data;
        setAppid(d.appid || "");
        setConfigured(d.configured);
      }
    });
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await api.put("/config", { appid, appsecret });
      setMsg("保存成功");
      setConfigured(true);
    } catch {
      setMsg("保存失败");
    }
    setSaving(false);
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-6">微信公众号配置</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-fg-secondary mb-1">AppID</label>
          <input
            value={appid}
            onChange={(e) => setAppid(e.target.value)}
            className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-fg-primary outline-none focus:border-accent"
            placeholder="wx..."
          />
        </div>
        <div>
          <label className="block text-sm text-fg-secondary mb-1">AppSecret</label>
          <input
            value={appsecret}
            onChange={(e) => setAppsecret(e.target.value)}
            type="password"
            className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-lg text-sm text-fg-primary outline-none focus:border-accent"
            placeholder={configured ? "已配置（输入新值覆盖）" : "输入 AppSecret"}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          {msg && <span className="text-sm text-success">{msg}</span>}
          {configured && <span className="text-xs text-fg-muted">✓ 已配置</span>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9: Verify editor page renders**

```bash
cd D:/Web/wechat-editor/frontend
npm run dev
# Open http://localhost:5173/ in browser
# Click "新建文章" (needs backend running on :8000)
# Verify: article list, editor with Monaco, preview panel
```

- [ ] **Step 10: Commit**

```bash
git add frontend/src/
git commit -m "feat: editor core — Monaco, tabs, wechat preview, article list, settings"
```

---

### Task 7: 操作面板 — 复制、发布、图片管理

**Files:**
- Create: `frontend/src/hooks/useClipboard.ts`
- Create: `frontend/src/hooks/useImageUpload.ts`
- Create: `frontend/src/components/panel/ActionPanel.tsx`
- Create: `frontend/src/components/panel/ImageManager.tsx`
- Modify: `frontend/src/pages/Editor.tsx`

- [ ] **Step 1: Create hooks/useClipboard.ts**

```typescript
import { processForWechat } from "@/utils/inliner";

export function useClipboard() {
  const copyRichText = async (html: string, css: string): Promise<boolean> => {
    const processed = processForWechat(html, css);

    try {
      // Modern Clipboard API
      const blob = new Blob([processed], { type: "text/html" });
      const plainBlob = new Blob([processed], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": plainBlob,
        }),
      ]);
      return true;
    } catch {
      // Fallback: selection + execCommand
      const container = document.createElement("div");
      container.innerHTML = processed;
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.setAttribute("contenteditable", "true");
      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNodeContents(container);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      const ok = document.execCommand("copy");
      document.body.removeChild(container);
      return ok;
    }
  };

  return { copyRichText };
}
```

- [ ] **Step 2: Create hooks/useImageUpload.ts**

```typescript
import { useCallback } from "react";
import api from "@/lib/api";
import type { ImageRecord } from "@/types";

export function useImageUpload() {
  const upload = useCallback(async (file: File): Promise<ImageRecord | null> => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.code === 0) return res.data.data;
    } catch (e) {
      console.error("Upload failed:", e);
    }
    return null;
  }, []);

  return { upload };
}
```

- [ ] **Step 3: Create components/panel/ImageManager.tsx**

```tsx
import { useState, useEffect } from "react";
import { Upload, Copy, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { ImageRecord } from "@/types";

interface ImageManagerProps {
  onInsert: (url: string) => void;
}

export default function ImageManager({ onInsert }: ImageManagerProps) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const { upload } = useImageUpload();

  const load = () => {
    api.get("/images").then((res) => {
      if (res.data.code === 0) setImages(res.data.data);
    });
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const record = await upload(file);
      if (record) {
        load();
        onInsert(`/images/${record.path}`);
      }
    };
    input.click();
  };

  const copyUrl = (path: string) => {
    navigator.clipboard.writeText(`/images/${path}`);
  };

  const deleteImage = async (id: string) => {
    await api.delete(`/images/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-fg-secondary">图片管理</span>
        <button onClick={handleUpload} className="p-1 rounded hover:bg-surface-tertiary text-fg-muted hover:text-fg-primary">
          <Upload size={14} />
        </button>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {images.map((img) => (
          <div key={img.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-tertiary text-xs group">
            <img src={`/images/${img.path}`} className="w-8 h-8 rounded object-cover bg-surface-tertiary" alt="" />
            <span className="flex-1 truncate text-fg-secondary">{img.filename}</span>
            <button onClick={() => copyUrl(img.path)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent">
              <Copy size={12} />
            </button>
            <button onClick={() => deleteImage(img.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-error">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create components/panel/ActionPanel.tsx**

```tsx
import { useState } from "react";
import { Copy, Send, Download } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { processForWechat } from "@/utils/inliner";
import ImageManager from "./ImageManager";
import api from "@/lib/api";
import type { Article } from "@/types";

interface ActionPanelProps {
  article: Article;
  onInsertImage: (url: string) => void;
}

export default function ActionPanel({ article, onInsertImage }: ActionPanelProps) {
  const { copyRichText } = useClipboard();
  const [copyMsg, setCopyMsg] = useState("");
  const [publishMsg, setPublishMsg] = useState("");
  const [publishing, setPublishing] = useState(false);

  const handleCopy = async () => {
    const ok = await copyRichText(article.html, article.css);
    setCopyMsg(ok ? "已复制!" : "复制失败");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishMsg("");
    try {
      const res = await api.post("/publish/draft", { article_id: article.id });
      setPublishMsg(res.data.code === 0 ? "草稿已推送!" : res.data.message);
    } catch (e: any) {
      setPublishMsg(e.response?.data?.message || "推送失败");
    }
    setPublishing(false);
    setTimeout(() => setPublishMsg(""), 3000);
  };

  const handleExport = () => {
    const processed = processForWechat(article.html, article.css);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${article.title}</title></head><body>${processed}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${article.title || "article"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-56 shrink-0 border-l border-border p-4 bg-surface-secondary overflow-y-auto space-y-4">
      {/* Actions */}
      <div className="space-y-2">
        <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">
          <Copy size={14} /> 一键复制富文本
        </button>
        {copyMsg && <div className="text-xs text-success">{copyMsg}</div>}

        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full flex items-center gap-2 px-3 py-2 bg-surface-tertiary hover:bg-border text-fg-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Send size={14} /> {publishing ? "推送中..." : "推送到草稿箱"}
        </button>
        {publishMsg && <div className="text-xs text-fg-secondary">{publishMsg}</div>}

        <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 bg-surface-tertiary hover:bg-border text-fg-primary rounded-lg text-sm font-medium transition-colors">
          <Download size={14} /> 导出 HTML
        </button>
      </div>

      <hr className="border-border" />

      {/* Image Manager */}
      <ImageManager onInsert={onInsertImage} />
    </div>
  );
}
```

- [ ] **Step 5: Update Editor.tsx — add ActionPanel**

In `frontend/src/pages/Editor.tsx`, add ActionPanel to the right side of the layout:

Import ActionPanel at the top:
```typescript
import ActionPanel from "@/components/panel/ActionPanel";
```

Add an image insert handler:
```typescript
const handleInsertImage = (url: string) => {
  if (!article) return;
  const imgTag = `<img src="${url}" style="max-width:100%;" />`;
  updateField("html", article.html + "\n" + imgTag);
};
```

Add ActionPanel after the preview div, inside the `flex-1 flex overflow-hidden` container:
```tsx
<ActionPanel article={article} onInsertImage={handleInsertImage} />
```

- [ ] **Step 6: Verify the full editor flow**

```bash
cd D:/Web/wechat-editor/frontend
npm run dev
# 1. Create article
# 2. Type HTML in editor
# 3. See preview update
# 4. Click "一键复制富文本"
# 5. Paste into any rich-text editor to verify
# 6. Upload an image via panel
```

- [ ] **Step 7: Commit**

```bash
git add frontend/src/hooks/ frontend/src/components/panel/ frontend/src/pages/Editor.tsx
git commit -m "feat: action panel — rich-text copy, publish, export, image manager"
```

---

### Task 8: Markdown 模式

**Files:**
- Create: `frontend/src/utils/markdown.ts`
- Create: `frontend/src/components/editor/MarkdownEditor.tsx`
- Create: `frontend/src/components/panel/ThemeSelector.tsx`
- Modify: `frontend/src/pages/Editor.tsx`

- [ ] **Step 1: Create utils/markdown.ts**

```typescript
import { Marked } from "marked";
import hljs from "highlight.js";

const WX_THEMES: Record<string, Record<string, string>> = {
  default: {
    h1: "font-size:24px;font-weight:bold;margin:20px 0 10px;color:#333;",
    h2: "font-size:20px;font-weight:bold;margin:18px 0 8px;color:#333;border-bottom:1px solid #eee;padding-bottom:6px;",
    h3: "font-size:18px;font-weight:bold;margin:16px 0 6px;color:#333;",
    p: "margin:8px 0;line-height:1.8;font-size:16px;color:#333;",
    blockquote: "border-left:4px solid #A855F7;padding:10px 16px;margin:12px 0;background:#f9f9f9;color:#666;",
    code_inline: "background:#f3f4f6;padding:2px 6px;border-radius:3px;font-size:14px;color:#e83e8c;font-family:Menlo,Monaco,monospace;",
    code_block: "background:#1e1e1e;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.6;",
    a: "color:#576b95;text-decoration:none;",
    img: "max-width:100%;border-radius:4px;margin:8px 0;",
    ul: "padding-left:24px;margin:8px 0;",
    ol: "padding-left:24px;margin:8px 0;",
    li: "margin:4px 0;line-height:1.8;font-size:16px;color:#333;",
    strong: "font-weight:bold;color:#333;",
    em: "font-style:italic;color:#555;",
    table: "border-collapse:collapse;width:100%;margin:12px 0;",
    th: "border:1px solid #ddd;padding:8px 12px;background:#f5f5f5;font-weight:bold;text-align:left;font-size:14px;",
    td: "border:1px solid #ddd;padding:8px 12px;font-size:14px;",
    hr: "border:none;border-top:1px solid #eee;margin:16px 0;",
  },
  elegant: {
    h1: "font-size:24px;font-weight:bold;margin:24px 0 12px;color:#2c3e50;text-align:center;",
    h2: "font-size:20px;font-weight:bold;margin:20px 0 10px;color:#2c3e50;",
    h3: "font-size:17px;font-weight:bold;margin:16px 0 8px;color:#2c3e50;",
    p: "margin:10px 0;line-height:2;font-size:15px;color:#3f3f3f;letter-spacing:0.5px;",
    blockquote: "border-left:3px solid #2c3e50;padding:12px 20px;margin:16px 0;background:#fafbfc;color:#666;font-style:italic;",
    code_inline: "background:#f0f0f0;padding:2px 6px;border-radius:3px;font-size:13px;color:#c7254e;",
    code_block: "background:#282c34;padding:16px;border-radius:6px;overflow-x:auto;font-size:13px;line-height:1.6;",
    a: "color:#1a73e8;text-decoration:none;border-bottom:1px solid #1a73e8;",
    img: "max-width:100%;border-radius:6px;margin:12px 0;box-shadow:0 2px 8px rgba(0,0,0,0.1);",
    ul: "padding-left:24px;margin:10px 0;",
    ol: "padding-left:24px;margin:10px 0;",
    li: "margin:6px 0;line-height:1.9;font-size:15px;color:#3f3f3f;",
    strong: "font-weight:bold;color:#2c3e50;",
    em: "font-style:italic;color:#666;",
    table: "border-collapse:collapse;width:100%;margin:16px 0;",
    th: "border:1px solid #ddd;padding:10px 14px;background:#f8f9fa;font-weight:600;text-align:left;font-size:14px;",
    td: "border:1px solid #ddd;padding:10px 14px;font-size:14px;",
    hr: "border:none;border-top:1px solid #e0e0e0;margin:20px 0;",
  },
};

export function getThemeNames(): string[] {
  return Object.keys(WX_THEMES);
}

export function renderMarkdown(md: string, theme: string = "default"): string {
  const styles = WX_THEMES[theme] || WX_THEMES.default;

  const marked = new Marked({
    renderer: {
      heading({ text, depth }) {
        const tag = `h${depth}` as keyof typeof styles;
        return `<${tag} style="${styles[tag] || styles.h3}">${text}</${tag}>`;
      },
      paragraph({ text }) {
        return `<p style="${styles.p}">${text}</p>`;
      },
      blockquote({ text }) {
        return `<blockquote style="${styles.blockquote}">${text}</blockquote>`;
      },
      code({ text, lang }) {
        let highlighted = text;
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(text, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(text).value;
        }
        return `<pre style="${styles.code_block}"><code style="color:#abb2bf;font-family:Menlo,Monaco,monospace;">${highlighted}</code></pre>`;
      },
      codespan({ text }) {
        return `<code style="${styles.code_inline}">${text}</code>`;
      },
      link({ href, text }) {
        return `<a href="${href}" style="${styles.a}">${text}</a>`;
      },
      image({ href, text }) {
        return `<img src="${href}" alt="${text}" style="${styles.img}" />`;
      },
      list({ items, ordered }) {
        const tag = ordered ? "ol" : "ul";
        const style = ordered ? styles.ol : styles.ul;
        const inner = items.map(i => i.text).map(t => `<li style="${styles.li}">${t}</li>`).join("");
        return `<${tag} style="${style}">${inner}</${tag}>`;
      },
      strong({ text }) {
        return `<strong style="${styles.strong}">${text}</strong>`;
      },
      em({ text }) {
        return `<em style="${styles.em}">${text}</em>`;
      },
      table({ header, rows }) {
        const ths = header.map(h => `<th style="${styles.th}">${h.text}</th>`).join("");
        const trs = rows.map(row => `<tr>${row.map(cell => `<td style="${styles.td}">${cell.text}</td>`).join("")}</tr>`).join("");
        return `<table style="${styles.table}"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
      },
      hr() {
        return `<hr style="${styles.hr}" />`;
      },
    },
  });

  return marked.parse(md) as string;
}
```

- [ ] **Step 2: Create components/panel/ThemeSelector.tsx**

```tsx
import { getThemeNames } from "@/utils/markdown";

interface ThemeSelectorProps {
  value: string;
  onChange: (theme: string) => void;
}

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const themes = getThemeNames();

  return (
    <div>
      <span className="text-xs font-medium text-fg-secondary mb-2 block">Markdown 主题</span>
      <div className="space-y-1">
        {themes.map((t) => (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
              value === t ? "bg-accent text-white" : "text-fg-secondary hover:bg-surface-tertiary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create components/editor/MarkdownEditor.tsx**

```tsx
import MonacoEditor from "./MonacoEditor";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return <MonacoEditor value={value} onChange={onChange} language="markdown" />;
}
```

- [ ] **Step 4: Update Editor.tsx for Markdown mode**

In `pages/Editor.tsx`, add Markdown mode support:

Add imports:
```typescript
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import ThemeSelector from "@/components/panel/ThemeSelector";
import { renderMarkdown } from "@/utils/markdown";
```

Add state:
```typescript
const [mdTheme, setMdTheme] = useState("default");
```

In the editor area, switch between HTML/Markdown mode:
```tsx
{article.mode === "html" ? (
  <div className="flex-1 flex flex-col min-w-0 border-r border-border">
    <EditorTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={HTML_TABS} />
    <div className="flex-1">
      <MonacoEditor value={editorValue} onChange={(v) => updateField(activeTab as keyof Article, v)} language={LANG_MAP[activeTab] || "html"} />
    </div>
  </div>
) : (
  <div className="flex-1 flex flex-col min-w-0 border-r border-border">
    <div className="h-9 border-b border-border bg-surface-secondary flex items-center px-4 text-xs text-fg-muted">
      Markdown
    </div>
    <div className="flex-1">
      <MarkdownEditor value={article.markdown} onChange={(v) => updateField("markdown", v)} />
    </div>
  </div>
)}
```

For preview in Markdown mode, convert markdown to HTML:
```tsx
const previewHtml = article.mode === "markdown" ? renderMarkdown(article.markdown, mdTheme) : article.html;
const previewCss = article.mode === "markdown" ? "" : article.css;
```

Pass these to WechatPreview instead of article.html/article.css.

Add mode toggle in the title bar:
```tsx
<div className="flex gap-1 mr-4">
  <button onClick={() => updateField("mode", "html")} className={`px-2 py-1 text-xs rounded ${article.mode === "html" ? "bg-accent text-white" : "text-fg-muted"}`}>
    HTML
  </button>
  <button onClick={() => updateField("mode", "markdown")} className={`px-2 py-1 text-xs rounded ${article.mode === "markdown" ? "bg-accent text-white" : "text-fg-muted"}`}>
    Markdown
  </button>
</div>
```

Add ThemeSelector to ActionPanel (or pass to it) when mode is markdown.

- [ ] **Step 5: Verify Markdown mode**

```bash
npm run dev
# Create article, switch to Markdown mode
# Type "# Hello\n\nThis is **bold**\n\n```js\nconsole.log('hi')\n```"
# Verify preview shows styled output with inline styles
# Switch themes, verify style changes
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/utils/markdown.ts frontend/src/components/editor/MarkdownEditor.tsx frontend/src/components/panel/ThemeSelector.tsx frontend/src/pages/Editor.tsx
git commit -m "feat: Markdown mode with themed rendering and code highlighting"
```

---

### Task 9: Docker Compose + 部署配置

**Files:**
- Create: `docker-compose.yml`
- Create: `data/.gitkeep`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
version: "3.8"

services:
  frontend:
    build: ./frontend
    ports:
      - "7070:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "7071:8000"
    volumes:
      - ./data:/app/data
    environment:
      - IMAGES_DIR=/app/data/images
      - ARTICLES_DIR=/app/data/articles
      - CONFIG_FILE=/app/data/config.json
      - MAX_UPLOAD_SIZE=52428800
```

- [ ] **Step 2: Create data directory placeholders**

```bash
mkdir -p D:/Web/wechat-editor/data/images
mkdir -p D:/Web/wechat-editor/data/articles
touch D:/Web/wechat-editor/data/.gitkeep
```

- [ ] **Step 3: Create .gitignore**

```
# data
data/images/
data/articles/
data/config.json
!data/.gitkeep

# node
frontend/node_modules/
frontend/dist/

# python
backend/__pycache__/
backend/app/__pycache__/
**/__pycache__/
*.pyc
```

- [ ] **Step 4: Test Docker build locally**

```bash
cd D:/Web/wechat-editor
docker compose build
# Expected: both images build successfully

docker compose up -d
# Expected: frontend on :7070, backend on :7071

# Test
curl http://localhost:7071/api/v1/articles
# Expected: {"code":0,"data":[]}

# Open http://localhost:7070 in browser
# Expected: Article list page loads
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml data/.gitkeep .gitignore
git commit -m "feat: Docker Compose deployment config"
```

---

### Task 10: Agent Skill 文件

**Files:**
- Create: `skill/SKILL.md`

- [ ] **Step 1: Create skill/SKILL.md**

```markdown
---
name: wechat-editor
description: >
  微信公众号文章编辑发布工具 — 创建/编辑/预览文章，管理图床，一键推送到公众号草稿箱。
  Use when the user wants to create, edit, preview, or publish WeChat Official Account articles.
  Triggers on: "公众号", "微信文章", "推文", "wechat article", "草稿箱", or when
  asked to write/format/publish content for WeChat.
---

# WeChat Editor — 公众号文章编辑发布

通过 NAS 上的 WeChat Editor 服务创建、编辑、预览和发布公众号文章。

**API Base URL**: `http://localhost:7071/api/v1`
**Web 编辑器**: `http://localhost:7070`

用户可以直接说"帮我写一篇公众号文章"、"把这段内容发到公众号"、"上传封面图"等，你来调用对应 API。

---

## 工作流

### 典型流程：写文章 → 发布

1. 创建文章
2. 写入 HTML/CSS 内容（或 Markdown）
3. 上传图片（如需要）
4. 推送到草稿箱（或告诉用户打开 Web 编辑器复制富文本）

---

## API 文档

### 一、文章管理

#### 1. 创建文章
```bash
curl -X POST http://localhost:7071/api/v1/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"文章标题","mode":"html"}'
```
- **mode**: `html` 或 `markdown`
- 返回文章对象，包含 `id` 字段

#### 2. 列出所有文章
```bash
curl http://localhost:7071/api/v1/articles
```

#### 3. 获取文章详情
```bash
curl http://localhost:7071/api/v1/articles/{article_id}
```

#### 4. 更新文章
```bash
curl -X PUT http://localhost:7071/api/v1/articles/{article_id} \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>标题</h1><p>正文内容</p>","css":"h1{color:#333;}"}'
```
可更新字段：`title`, `mode`, `html`, `css`, `js`, `markdown`, `cover`, `author`, `digest`

#### 5. 删除文章
```bash
curl -X DELETE http://localhost:7071/api/v1/articles/{article_id}
```

### 二、图片管理（图床）

#### 1. 上传图片
```bash
curl -X POST http://localhost:7071/api/v1/images/upload \
  -F "file=@/path/to/image.jpg"
```
- 返回：`{"path":"2026/04/04/md5hash.jpg",...}`
- 在文章 HTML 中使用：`<img src="/images/2026/04/04/md5hash.jpg" />`
- 同一张图自动 MD5 去重

#### 2. 列出所有图片
```bash
curl http://localhost:7071/api/v1/images
```

#### 3. 删除图片
```bash
curl -X DELETE http://localhost:7071/api/v1/images/{image_id}
```

### 三、发布

#### 1. 获取处理后的 HTML（供复制）
```bash
curl http://localhost:7071/api/v1/publish/html/{article_id}
```
返回原始 HTML + CSS，供前端做 juice inline 处理后复制。

#### 2. 处理文章图片（替换为微信 CDN URL）
```bash
curl -X POST http://localhost:7071/api/v1/publish/process \
  -H "Content-Type: application/json" \
  -d '{"article_id":"xxx"}'
```
- 将文章中所有本地图片上传到微信 CDN 并替换 URL
- 需要先配置微信 AppID/AppSecret

#### 3. 推送到微信草稿箱
```bash
curl -X POST http://localhost:7071/api/v1/publish/draft \
  -H "Content-Type: application/json" \
  -d '{"article_id":"xxx","author":"作者名","digest":"文章摘要"}'
```
- 自动处理图片上传 + URL 替换
- 自动上传封面图
- 需要配置微信 API

### 四、配置

#### 1. 查看配置状态
```bash
curl http://localhost:7071/api/v1/config
```

#### 2. 设置微信 AppID/AppSecret
```bash
curl -X PUT http://localhost:7071/api/v1/config \
  -H "Content-Type: application/json" \
  -d '{"appid":"wx...","appsecret":"..."}'
```

---

## 写作指南

### HTML 模式公众号兼容规则

写给公众号的 HTML 必须遵守以下规则（系统会自动做 CSS inline 化和标签过滤，但源码遵守这些规则效果最好）：

- **使用 `<section>` 代替 `<div>`**
- **字号用 px**，不用 rem/em
- **颜色用十六进制** `#333333`，不用 rgb()/变量
- **不使用 CSS Grid**
- **不使用 position: fixed/absolute**
- **flexbox 谨慎使用**（部分公众号客户端不支持）
- **内容宽度不超过 578px**
- **图片加 `style="max-width:100%;"`**

### 编辑器预览

告诉用户打开 Web 编辑器查看效果：
```
请打开 http://localhost:7070/editor/{article_id} 查看预览效果
```
```

- [ ] **Step 2: Copy skill to Claude Code and OpenClaw directories**

```bash
# Claude Code
mkdir -p "C:/Users/93577/.claude/skills/wechat-editor"
cp D:/Web/wechat-editor/skill/SKILL.md "C:/Users/93577/.claude/skills/wechat-editor/SKILL.md"

# OpenClaw
mkdir -p "C:/Users/93577/.openclaw/workspace/skills/wechat-editor"
cp D:/Web/wechat-editor/skill/SKILL.md "C:/Users/93577/.openclaw/workspace/skills/wechat-editor/SKILL.md"
```

- [ ] **Step 3: Commit**

```bash
git add skill/
git commit -m "feat: Agent skill for Claude Code and OpenClaw"
```

---

### Task 11: 端到端验证

- [ ] **Step 1: Start full stack**

```bash
cd D:/Web/wechat-editor
docker compose up -d --build
```

- [ ] **Step 2: Verify article CRUD**

```bash
# Create
curl -X POST http://localhost:7071/api/v1/articles -H "Content-Type: application/json" -d '{"title":"Test Article","mode":"html"}'
# Save returned id

# Update with HTML
curl -X PUT http://localhost:7071/api/v1/articles/{id} -H "Content-Type: application/json" -d '{"html":"<section style=\"text-align:center;\"><h1 style=\"font-size:24px;color:#333;\">Hello WeChat</h1><p style=\"font-size:16px;line-height:1.8;color:#666;\">This is a test article.</p></section>"}'

# Get
curl http://localhost:7071/api/v1/articles/{id}
```

- [ ] **Step 3: Verify image upload**

```bash
# Create a test image
curl -X POST http://localhost:7071/api/v1/images/upload -F "file=@/path/to/test.png"
# Verify image accessible at http://localhost:7071/images/{returned_path}
```

- [ ] **Step 4: Verify Web UI**

```
Open http://localhost:7070 in browser
1. Click "新建文章"
2. Type HTML in editor
3. Verify preview updates in real-time
4. Click "一键复制富文本"
5. Open WeChat backend editor, Ctrl+V paste
6. Verify formatting is preserved
7. Switch to Markdown mode, type markdown
8. Verify themed preview renders correctly
```

- [ ] **Step 5: Verify skill works**

Open a new Claude Code session and test:
```
"帮我创建一篇公众号文章，标题叫测试文章"
```
Verify the skill triggers and creates the article via curl.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: end-to-end verification complete"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | 后端脚手架 | main.py, config, response, exceptions, Dockerfile |
| 2 | 文章 CRUD API | article_service.py, articles.py |
| 3 | 图床服务 | image_service.py, images.py |
| 4 | 微信 API + 发布 | wechat_service.py, wechat.py, publish.py |
| 5 | 前端脚手架 | package.json, vite, router, layout, types |
| 6 | 编辑器核心 | Monaco, EditorTabs, WechatPreview, inliner, sanitizer |
| 7 | 操作面板 | useClipboard, ActionPanel, ImageManager |
| 8 | Markdown 模式 | markdown.ts, MarkdownEditor, ThemeSelector |
| 9 | Docker 部署 | docker-compose.yml, .gitignore |
| 10 | Agent Skill | SKILL.md → CC + OpenClaw |
| 11 | 端到端验证 | 全栈集成测试 |
