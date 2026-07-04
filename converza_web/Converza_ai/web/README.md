# Theater UI source (React)

**This is not a backend and not a production server.**

All APIs live in FastAPI (`../main.py`). This folder is UI source code only.

## How production works

1. `npm run build` compiles React → plain HTML/JS/CSS in `web/out/`
2. `scripts/build-theater.sh` copies `out/` → `../static/theater/`
3. FastAPI serves `static/theater/` at `/app` (same pattern as `static/landing.html`)
4. Docker image is **Python only** — no Node on the VPS

There is no Next.js process in production. No API routes in this app.

## When you change the UI

```bash
./scripts/build-theater.sh
git add converza_web/Converza_ai/static/theater converza_web/Converza_ai/web/
git commit -m "..."
```

Then on VPS: `sudo ./scripts/redeploy-web.sh`

## Local dev (optional)

```bash
cd web
npm install
NEXT_PUBLIC_CONVERZA_API_URL=http://127.0.0.1:8001 npm run dev
```

Theater preview: http://localhost:3000/app — API calls go to FastAPI on :8001.
