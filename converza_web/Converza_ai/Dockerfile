# Stage 1 — Next.js static export (Theater UI at /app)
FROM node:20-alpine AS frontend

WORKDIR /build
COPY converza_web/Converza_ai/web/package.json converza_web/Converza_ai/web/package-lock.json ./
RUN npm ci
COPY converza_web/Converza_ai/web/ ./
RUN npm run build

# Stage 2 — FastAPI + static theater
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONPATH=/app

RUN adduser --disabled-password --gecos "" appuser

COPY converza_agent ./converza_agent
COPY deploy/hermes/skills ./deploy/hermes/skills
COPY converza_web/Converza_ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY converza_web/Converza_ai/ .
COPY --from=frontend /build/out ./static/theater

USER appuser

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
