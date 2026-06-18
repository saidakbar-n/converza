#!/usr/bin/env bash
# Bootstrap Ubuntu VPS for Converza v1.
# Run as root on a fresh droplet.

set -euo pipefail

echo "==> Installing Docker..."
apt-get update
apt-get install -y ca-certificates curl gnupg ufw nginx certbot python3-certbot-nginx
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> Firewall (SSH + HTTP/S)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo "==> Done. Next steps:"
echo "  1. Clone repo to /opt/converza"
echo "  2. Copy .env.production.example to /etc/converza/.env and fill values"
echo "  3. docker compose -f docker-compose.prod.yml up -d --build"
echo "  4. DOMAIN=getconverza.com CERTBOT_EMAIL=you@getconverza.com sudo -E ./deploy/setup-nginx.sh"
echo "     (see deploy/GETCONVERZA.COM.md)"
