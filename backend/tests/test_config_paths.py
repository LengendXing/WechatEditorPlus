from pathlib import Path

from app.core.config import default_data_root
from app.main import ensure_data_directories


def test_default_data_root_uses_repo_data_when_repo_layout_is_detected(tmp_path: Path):
    repo_root = tmp_path / "repo"
    (repo_root / "backend" / "app" / "core").mkdir(parents=True)
    (repo_root / "frontend").mkdir()
    (repo_root / "docker-compose.yml").write_text("services:\n", encoding="utf-8")

    module_path = repo_root / "backend" / "app" / "core" / "config.py"
    module_path.write_text("# test anchor\n", encoding="utf-8")

    assert default_data_root(module_path) == repo_root / "data"


def test_default_data_root_falls_back_to_backend_data_without_repo_layout(tmp_path: Path):
    container_root = tmp_path / "app"
    (container_root / "app" / "core").mkdir(parents=True)

    module_path = container_root / "app" / "core" / "config.py"
    module_path.write_text("# test anchor\n", encoding="utf-8")

    assert default_data_root(module_path) == container_root / "data"


def test_ensure_data_directories_creates_runtime_paths(tmp_path: Path, monkeypatch):
    from app.core import config as config_mod

    runtime_root = tmp_path / "runtime"
    monkeypatch.setattr(config_mod.settings, "IMAGES_DIR", str(runtime_root / "images"))
    monkeypatch.setattr(config_mod.settings, "ARTICLES_DIR", str(runtime_root / "articles"))
    monkeypatch.setattr(config_mod.settings, "MBDOCS_DIR", str(runtime_root / "mbdocs"))
    monkeypatch.setattr(config_mod.settings, "CONFIG_FILE", str(runtime_root / "config.json"))

    ensure_data_directories()

    assert (runtime_root / "images").is_dir()
    assert (runtime_root / "articles").is_dir()
    assert (runtime_root / "mbdocs").is_dir()
    assert runtime_root.is_dir()
