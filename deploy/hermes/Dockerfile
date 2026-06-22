FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git ripgrep ffmpeg python3 python3-pip python3-venv xz-utils \
    && rm -rf /var/lib/apt/lists/*

ENV HERMES_HOME=/opt/hermes
ENV PATH="/usr/local/bin:/opt/hermes/bin:${PATH}"

WORKDIR /app

# Debian bookworm blocks system pip (PEP 668); safe to override inside this container.
RUN pip3 install --no-cache-dir --break-system-packages mcp supabase httpx pydantic

COPY converza_mcp /app/converza_mcp
COPY deploy/hermes/skills /app/hermes-skills
COPY deploy/hermes/config.yaml.template /app/hermes-config.yaml.template
COPY deploy/hermes/patch_model.py /app/deploy/hermes/patch_model.py
COPY deploy/hermes/patch_telegram.py /app/deploy/hermes/patch_telegram.py

# Install Hermes at build time (root Linux → /usr/local/bin/hermes, data in $HERMES_HOME).
# PYTHONPATH must be unset during install or pip/entrypoints shadow the wrong checkout.
RUN env -u PYTHONPATH -u PYTHONHOME curl -fsSL https://hermes-agent.nousresearch.com/install.sh \
    | bash -s -- --skip-setup --skip-browser --no-skills --non-interactive \
    && test -x /usr/local/bin/hermes

ENV PYTHONPATH=/app

COPY deploy/hermes/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8642

ENTRYPOINT ["/entrypoint.sh"]
