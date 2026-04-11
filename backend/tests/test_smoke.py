"""Smoke test — verifies the FastAPI app can be imported and /healthz responds."""
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_app_imports():
    """The FastAPI app must be importable without runtime errors."""
    assert app is not None
    assert app.title  # has a title set


def test_healthz_responds():
    """The /healthz endpoint must return 200."""
    resp = client.get("/healthz")
    assert resp.status_code == 200
