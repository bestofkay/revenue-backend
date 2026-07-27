# API Documentation

Interactive OpenAPI UI: `http://localhost:4000/docs`

Base path: `/api/v1`

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Email/password (+ optional TOTP) |
| POST | /auth/refresh | Public | Rotate refresh token |
| POST | /auth/logout | Bearer | Revoke refresh token |
| POST | /auth/2fa/setup | Bearer | Begin TOTP enrollment |
| POST | /auth/2fa/enable | Bearer | Confirm TOTP |
| POST | /auth/oauth/token | Public | Client credentials (API key) |

## Core billing & payments

| Method | Path | Description |
|--------|------|-------------|
| POST | /assessments | Create assessment |
| POST | /assessments/:id/submit | Submit for approval |
| POST | /assessments/:id/approve | Multi-level approve |
| POST | /invoices | Create invoice (+ auto payment request) |
| POST | /invoices/from-assessment/:id | Invoice approved assessment |
| POST | /payments/create-link | Create payment link/VA |
| POST | /payments/generate-account | Allocate VA |
| GET | /payments/:code | Public payment page payload |
| POST | /payments/verify | Verify provider reference |
| POST | /payments/webhook/:provider | Provider webhooks |
| GET | /receipts/:id | Fetch electronic receipt |
| GET | /reports/dashboard | Admin dashboard aggregates |

Providers for webhook: `paystack`, `flutterwave`, `remita`.
