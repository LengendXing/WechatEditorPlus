from pathlib import Path

from pydantic_settings import BaseSettings


APP_VERSION = "5.0.0"
GITHUB_REPO = "AAAAAnson/mbeditor"


def default_data_root(module_path: str | Path | None = None) -> Path:
    source = Path(module_path or __file__).resolve()
    backend_root = source.parents[2]
    repo_root = backend_root.parent

    if backend_root.name == "backend" and (repo_root / "docker-compose.yml").exists():
        return repo_root / "data"

    return backend_root / "data"


DEFAULT_DATA_ROOT = default_data_root()


class Settings(BaseSettings):
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
    IMAGES_DIR: str = str(DEFAULT_DATA_ROOT / "images")
    ARTICLES_DIR: str = str(DEFAULT_DATA_ROOT / "articles")
    MBDOCS_DIR: str = str(DEFAULT_DATA_ROOT / "mbdocs")
    CONFIG_FILE: str = str(DEFAULT_DATA_ROOT / "config.json")

    model_config = {"env_prefix": ""}


settings = Settings()
