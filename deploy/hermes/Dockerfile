FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git ripgrep ffmpeg python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

ENV HERMES_HOME=/opt/hermes
ENV PATH="/opt/hermes/bin:${PATH}"
ENV PYTHONPATH=/app

WORKDIR /app

# Debian bookworm blocks system pip (PEP 668); safe to override inside this container.
RUN pip3 install --no-cache-dir --break-system-packages mcp supabase httpx pydantic

COPY converza_mcp /app/converza_mcp
COPY deploy/hermes/skills /app/hermes-skills
COPY deploy/hermes/config.yaml.template /app/hermes-config.yaml.template

RUN curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --no-onboard \
    || echo "Hermes install deferred to container start"

COPY deploy/hermes/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8642

ENTRYPOINT ["/entrypoint.sh"]
