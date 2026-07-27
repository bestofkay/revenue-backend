# Developer Guide

## Monorepo layout

```
apps/api      NestJS API
apps/web      Admin Next.js
apps/pay      Public pay Next.js
packages/database  Prisma schema + seed
packages/shared    codes, money, HMAC
packages/config    zod env schema
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (Postgres/Redis/RabbitMQ)

## Commands

```bash
pnpm install
pnpm build
pnpm test
pnpm --filter @revenue/api dev
pnpm --filter @revenue/database migrate:dev
pnpm --filter @revenue/database seed
```

## Adding a revenue type

1. Authenticate as agency admin
2. `POST /revenue/categories` then `POST /revenue/types`
3. Optional `POST /revenue/fees` for fee schedule in minor units (kobo)

## Gateway sandboxes

Unset or placeholder provider keys (`sk_test_xxx`, `FLWSECK_TEST-xxx`, `remita_api_key`) activate local VA generators so payment links work offline. Real keys call live provider APIs.

## Tests

```bash
pnpm --filter @revenue/shared test
pnpm --filter @revenue/api test
```

E2E pay flow (Playwright): `apps/pay` + API with simulate endpoint.
Performance: `tests/perf/k6-pay.js`
Security: `tests/security/zap-baseline.conf`
