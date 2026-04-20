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

# Suppress httpx request logging — it prints full URLs including tokens/secrets
logging.getLogger("httpx").setLevel(logging.WARNING)


def ensure_data_directories() -> None:
    for path in (
        Path(settings.IMAGES_DIR),
        Path(settings.ARTICLES_DIR),
        Path(settings.MBDOCS_DIR),
        Path(settings.CONFIG_FILE).parent,
    ):
        path.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_data_directories()
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
                content=fail(code=413, message="请求体过大。"),
            )
    return await call_next(request)


ensure_data_directories()
app.mount("/images", StaticFiles(directory=settings.IMAGES_DIR), name="images")

app.include_router(api_router)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
