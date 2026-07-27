# Deployment Guide

## Local (Docker Compose + MySQL)

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up -d mysql redis rabbitmq mailhog
pnpm install
pnpm --filter @revenue/shared build && pnpm --filter @revenue/config build
pnpm db:generate
pnpm --filter @revenue/database exec prisma migrate deploy
pnpm db:seed
pnpm --filter @revenue/api dev
```

`DATABASE_URL=mysql://revenue:revenue@localhost:3306/revenue`

## Render (API + MySQL + Redis + RabbitMQ)

Blueprint file: [`render.yaml`](../render.yaml) at the repo root.

### What gets created

| Service | Type | Notes |
|---------|------|--------|
| `revenue-api` | Web | Public HTTPS URL; Docker build from `infra/docker/Dockerfile.api` |
| `revenue-mysql` | Private + disk | MySQL 8; not reachable from the public internet |
| `revenue-redis` | Key Value | Internal `REDIS_URL` |
| `revenue-rabbitmq` | Private + disk | AMQP on 5672 |

The API entrypoint waits for MySQL, runs `prisma migrate deploy`, then starts NestJS.

### Prerequisites

1. Push this repo to **GitHub** or **GitLab** (Render deploys from git).
2. Create a [Render](https://dashboard.render.com) account.
3. Billing: MySQL/RabbitMQ need a **Starter** private service + disk (not free). API + Redis can use the free plan.

### Deploy steps

1. Open [Render Dashboard → New → Blueprint](https://dashboard.render.com/select-repo?type=blueprint).
2. Connect the repository that contains `render.yaml`.
3. When prompted, set these values (examples):

   | Key | Example value |
   |-----|----------------|
   | `FIELD_ENCRYPTION_KEY` | 64+ hex chars, e.g. `openssl rand -hex 32` |
   | `APP_URL` | `https://your-admin.netlify.app` (placeholder OK for now) |
   | `PAY_URL` | `https://your-pay.netlify.app` (placeholder OK for now) |
   | `CORS_ORIGINS` | same Netlify origins, comma-separated |

4. Apply the Blueprint and wait until **all four** services are live (MySQL/RabbitMQ first, then API).
5. Open the API service → copy **URL**. Useful paths:

   - Health: `https://<api-host>/api/v1/health`
   - Swagger: `https://<api-host>/docs`

6. Optional seed (Render shell on `revenue-api`):

   ```bash
   pnpm --filter @revenue/database seed
   ```

### URLs you will use later (Netlify)

| Variable | Where | Value |
|----------|--------|--------|
| API public URL | Netlify `NEXT_PUBLIC_API_URL` | `https://<api-host>/api/v1` |
| Admin / Pay origins | Render `CORS_ORIGINS`, `APP_URL`, `PAY_URL` | your Netlify site URLs |

Update `APP_URL` / `PAY_URL` / `CORS_ORIGINS` on `revenue-api` after Netlify sites exist, then redeploy the API.

### Cost / free-tier notes

- Free web services **spin down** when idle (cold starts).
- Private MySQL/RabbitMQ + disks are always-on paid resources.
- Keep Redis `ipAllowList: []` so it stays private.

## Railway (full stack)

Preferred all-in-one host for this monorepo (API + web + pay + MySQL + Redis + RabbitMQ).

See **[`docs/railway.md`](./railway.md)** and **[`.env.railway.example`](../.env.railway.example)**.

## Kubernetes (Helm)

```bash
kubectl create secret generic revenue-api-secrets --from-env-file=.env
helm upgrade --install revenue infra/helm/revenue-platform
```

## Terraform (AWS)

Provisions VPC, **RDS MySQL 8.4**, ElastiCache Redis.

```bash
cd infra/terraform
terraform init
terraform plan -var="db_password=***"
terraform apply
```

## Monitoring

- Prometheus: `infra/monitoring/prometheus.yml`
- Grafana: `infra/monitoring/grafana-datasource.yml`
- ELK/Logstash: `infra/monitoring/logstash.conf`

## Production hardening checklist

- [ ] Rotate JWT / HMAC / field encryption keys
- [ ] Set real Paystack / Flutterwave / Remita secrets
- [ ] `COOKIE_SECURE=true`, tight CORS allowlist
- [ ] Disable `POST /payments/simulate`
- [ ] Persist password-reset tokens in Redis (replace in-memory map)
- [ ] Enable DB backups and deletion protection
- [ ] Configure TLS at ingress
