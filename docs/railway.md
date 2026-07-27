# Deploy on Railway

Full-stack deploy of this monorepo on [Railway](https://railway.com): API, admin web, pay portal, MySQL, Redis, and RabbitMQ.

## Services to create

| Railway service | Source | Config-as-code path |
|-----------------|--------|---------------------|
| **Api** | same GitHub repo | `/apps/api/railway.toml` |
| **Web** | same repo | `/apps/web/railway.toml` (admin **and** public pay portal) |
| **RabbitMQ** | same repo | `/infra/railway/rabbitmq/railway.toml` |
| **MySQL** | Railway plugin | — |
| **Redis** | Railway plugin | — |

Public pay routes on Web (no login): `/pay`, `/pay/[code]`, `/receipts/[id]`, `/receipts/verify/[id]`.

Keep each custom service **Root Directory** at `/` (repo root). The Dockerfiles need the monorepo layout.

## One-time setup

1. New Project → Deploy from GitHub → `bestofkay/revenue-backend` (or your fork).
2. Delete the auto-detected single service if it is wrong, then add services as in the table above.
3. For each of Api / Web / RabbitMQ:
   - Settings → **Config as code** → set the path from the table
   - Generate domain (Api, Web only)
4. Add plugins: **MySQL** + **Redis**.
5. On **RabbitMQ**, set:
   - `RABBITMQ_DEFAULT_USER=revenue`
   - `RABBITMQ_DEFAULT_PASS=<strong password>`
6. Copy variables from [`.env.railway.example`](../.env.railway.example) into each service.
   - Rename `${{MySQL}}` / `${{Redis}}` / `${{Api}}` / `${{Web}}` / `${{RabbitMQ}}` to match your **exact** Railway service names.
   - Set **both** `APP_URL` and `PAY_URL` to the Web public URL.
7. Generate secrets for the API:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# use once each for JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, HMAC_PAYMENT_SECRET
# FIELD_ENCRYPTION_KEY needs 64 hex chars:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

8. Deploy order: MySQL → Redis → RabbitMQ → **Api** → Web.
9. Smoke test:
   - `https://<api>/api/v1/health`
   - `https://<api>/docs`
   - Admin: `https://<web>/login`
   - Pay (no auth): `https://<web>/pay`

## Optional seed

Open a shell on the Api service:

```bash
pnpm --filter @revenue/database seed
```

## Notes

- `NEXT_PUBLIC_API_URL` is baked in at **build** time — redeploy Web after the API domain changes.
- Do **not** deploy `apps/pay` separately; it is merged into Web.
- API entrypoint waits for MySQL, runs `prisma migrate deploy`, then starts NestJS.
- `PORT` is provided by Railway; apps listen on it (Next uses standalone + `HOSTNAME=0.0.0.0`).
- RabbitMQ stays private (no public domain) unless you need the management UI on `15672`.

## Files

| Path | Role |
|------|------|
| `apps/*/railway.toml` | Build/deploy config per app |
| `infra/docker/Dockerfile.*` | Production images |
| `infra/docker/api-entrypoint.sh` | Migrations + Railway/Render env wiring |
| `.env.railway.example` | Variable reference template |
