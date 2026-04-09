#!/bin/sh
mkdir -p /app/data/images /app/data/articles
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
