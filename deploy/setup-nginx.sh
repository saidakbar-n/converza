#!/usr/bin/env bash
# Configure Nginx reverse proxy + Let's Encrypt SSL
#
# Run on the VPS as root (after docker compose is up on 127.0.0.1:8001):
#   cd /opt/converza && DOMAIN=getconverza.com CERTBOT_EMAIL=you@getconverza.com sudo -E ./deploy/setup-nginx.sh
#
# Prerequisites:
#   - DNS A records: @ and www → 162.243.174.80
#   - UFW allows Nginx Full (80/443)
#   - curl http://127.0.0.1:8001/health returns OK

set -euo pipefail

DOMAIN="${DOMAIN:-getconverza.com}"
WWW_DOMAIN="www.${DOMAIN}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
NGINX_AVAILABLE="/etc/nginx/sites-available/converza"
NGINX_ENABLED="/etc/nginx/sites-enabled/converza"
BOOTSTRAP_TEMPLATE="${REPO_ROOT}/deploy/nginx/site.bootstrap.template"
SSL_TEMPLATE="${REPO_ROOT}/deploy/nginx/site.ssl.template"

render_template() {
  local template="$1"
  local output="$2"
  sed "s/__DOMAIN__/${DOMAIN}/g" "$template" > "$output"
}

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: run as root (sudo ./deploy/setup-nginx.sh)" >&2
  exit 1
fi

if [[ ! -f "$BOOTSTRAP_TEMPLATE" || ! -f "$SSL_TEMPLATE" ]]; then
  echo "ERROR: missing nginx templates in deploy/nginx/" >&2
  exit 1
fi

echo "==> Domain: ${DOMAIN}"
echo "==> Checking app health on 127.0.0.1:8001..."
if ! curl -fsS "http://127.0.0.1:8001/health" >/dev/null 2>&1; then
  echo "WARN: web app not reachable on :8001 — start docker compose first." >&2
  echo "      docker compose -f docker-compose.prod.yml up -d --build" >&2
fi

echo "==> Installing nginx + certbot (if missing)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx

echo "==> Preparing ACME webroot..."
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot

echo "==> Installing bootstrap HTTP site..."
render_template "$BOOTSTRAP_TEMPLATE" "$NGINX_AVAILABLE"
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
nginx -t
systemctl enable nginx
systemctl reload nginx

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "==> Requesting Let's Encrypt certificate for ${DOMAIN} and ${WWW_DOMAIN}..."
  if [[ -z "${CERTBOT_EMAIL}" ]]; then
    echo "ERROR: set CERTBOT_EMAIL (e.g. CERTBOT_EMAIL=admin@${DOMAIN} sudo -E ./deploy/setup-nginx.sh)" >&2
    exit 1
  fi
  certbot certonly --webroot \
    -w /var/www/certbot \
    -d "${DOMAIN}" \
    -d "${WWW_DOMAIN}" \
    --email "${CERTBOT_EMAIL}" \
    --agree-tos \
    --non-interactive
else
  echo "==> Certificate already exists for ${DOMAIN}, skipping certbot certonly"
fi

echo "==> Installing production SSL site..."
render_template "$SSL_TEMPLATE" "$NGINX_AVAILABLE"
nginx -t
systemctl reload nginx

echo "==> Enabling certbot auto-renewal timer..."
systemctl enable certbot.timer 2>/dev/null || true
systemctl start certbot.timer 2>/dev/null || true

echo ""
echo "==> Nginx reverse proxy ready"
echo "    Public URL:  https://${DOMAIN}"
echo "    VPS IP:      162.243.174.80"
echo "    Upstream:    127.0.0.1:8001 (converza_web docker)"
echo ""
echo "Next:"
echo "  1. Set WEB_APP_URL=https://${DOMAIN} and ALLOWED_ORIGINS=https://${DOMAIN} in /etc/converza/.env"
echo "  2. docker compose -f docker-compose.prod.yml up -d"
echo "  3. TELEGRAM_WEBHOOK_SECRET=... ./scripts/register_webhook.sh set ${DOMAIN}"
echo "  4. BotFather → Bot Settings → Domain → ${DOMAIN}"
echo "  5. ./scripts/pilot-check.sh https://${DOMAIN}"
