# FastAPI only — Theater UI is pre-built static files in static/theater/
# (run scripts/build-theater.sh locally or in CI when web/ changes)
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONPATH=/app

RUN adduser --disabled-password --gecos "" appuser

COPY converza_agent ./converza_agent
COPY deploy/hermes/skills ./deploy/hermes/skills
COPY converza_web/Converza_ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY converza_web/Converza_ai/ .

RUN test -f static/theater/index.html || (echo "ERROR: static/theater/ missing — run: ./scripts/build-theater.sh" >&2 && exit 1)

USER appuser

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
