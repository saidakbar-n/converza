# Converza Theater UI (Next.js)

## Production

Built as a static export (`output: 'export'`, `basePath: '/app'`) and copied into `static/theater/` by the multi-stage Docker build. FastAPI serves it at `/app` on port 8001 — no separate Next.js process.

## Local development

Run the Next.js dev server and point API calls at FastAPI:

```bash
cd web
npm install
NEXT_PUBLIC_CONVERZA_API_URL=http://127.0.0.1:8001 npm run dev
```

Theater UI: http://localhost:3000/app

Run FastAPI separately on :8001 (from repo root or `Converza_ai/`).

## Static export (CI / manual)

```bash
cd web
npm ci
npm run build   # writes to web/out/
```

To preview with FastAPI locally, copy `web/out/` to `static/theater/` and start uvicorn.
