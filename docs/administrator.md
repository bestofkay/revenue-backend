# Administrator Guide

## First login

1. Open http://localhost:3000/login
2. Use `admin@revenue.gov.ng` / `ChangeMe@12345`
3. Change password and enable 2FA under profile (API: `/auth/2fa/setup`)

## Agency setup checklist

1. Create/verify agency and HQ branch
2. Configure gateway keys (Paystack/Flutterwave/Remita) per agency
3. Add TSA mapping account numbers
4. Define revenue categories, types, and fee schedules
5. Configure approval workflow roles (Approver, Agency Admin)
6. Create officers and assign roles
7. Issue API keys for machine integrations (`POST /users/api-keys`)

## Daily operations

- Monitor dashboard: today's/monthly revenue, pending, expired, conversion
- Approve assessments awaiting dual control
- Batch pending settlements and mark settled with TSA reference
- Review immutable audit trail for privileged changes

## Security hardening

- Rotate `JWT_*`, `HMAC_PAYMENT_SECRET`, `FIELD_ENCRYPTION_KEY`
- Restrict `CORS_ORIGINS`
- Use production provider webhook secrets
- Keep `COOKIE_SECURE=true` behind TLS
