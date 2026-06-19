# getconverza.com — VPS reverse proxy

| Item | Value |
|------|--------|
| Domain | `getconverza.com` |
| Public VPS IP | `162.243.174.80` |
| Private VPC IP | `10.116.0.2` (internal only — do not use in DNS) |
| Canonical URL | `https://getconverza.com` |

## 1. DNS (Namecheap)

| Type | Host | Value |
|------|------|-------|
| A Record | `@` | `162.243.174.80` |
| A Record | `www` | `162.243.174.80` |

Verify:

```bash
dig +short getconverza.com A
dig +short www.getconverza.com A
```

## 2. Deploy on VPS

```bash
ssh root@162.243.174.80
git clone https://github.com/YOUR_ORG/converza.git /opt/converza
cd /opt/converza
./deploy/setup-vps.sh
```

Set `/etc/converza/.env`:

```
WEB_APP_URL=https://getconverza.com
ALLOWED_ORIGINS=https://getconverza.com
```

```bash
docker compose -f docker-compose.prod.yml up -d --build
curl -s http://127.0.0.1:8001/health
curl -s http://127.0.0.1:8000/health
```

## 3. Nginx + SSL

```bash
DOMAIN=getconverza.com CERTBOT_EMAIL=admin@getconverza.com sudo -E ./deploy/setup-nginx.sh
```

## 4. Telegram

```bash
./scripts/register_webhook.sh set getconverza.com
```

BotFather → Domain → `getconverza.com`

## 5. Verify

```bash
curl -fsS https://getconverza.com/health
./scripts/pilot-check.sh https://getconverza.com
```
