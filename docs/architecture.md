# Architecture — Government Revenue Platform

## Topology

Single-tenant modular NestJS monolith for **Nigeria Customs (NCS)**.

```
apps/api          Domain modules (auth â†’ settlement)
apps/web          NCS admin console
apps/pay          Public payment pages
packages/database MySQL + Prisma
packages/shared   Codes, HMAC, money helpers
packages/config   Zod env validation
infra/            Docker, Helm, Terraform, monitoring
```

## Single-tenant model

- `TENANT_AGENCY_CODE=NCS` resolves the organisation context.
- Branches (Apapa, Tin Can, Onne, etc.) model ports/terminals.
- RBAC roles are agency-scoped; ABAC enforces agency isolation for officers.
- Super admins operate the NCS tenant by default.

## MySQL

- Provider: `mysql` in Prisma
- Long fields (`qrPayload`, signatures, secrets) use `TEXT` / `LONGTEXT`
- Money stored as integer **kobo**

## Payment engine

Invoice issue â†’ unique payment code â†’ HMAC token â†’ QR â†’ dedicated VA â†’ pay URL  
Webhook â†’ verify amount/ref/VA â†’ mark paid â†’ signed receipt â†’ ledger â†’ TSA batch â†’ notify

## Security

JWT + refresh rotation, API keys (OAuth2 client credentials), TOTP 2FA, password reset, RBAC + ABAC, Helmet, CORS, rate limits, AES-GCM field encryption, append-only audit logs.
