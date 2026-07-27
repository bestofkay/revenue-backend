# Deprecated — merged into `@revenue/web`

The public payment portal now lives in the admin web app as unauthenticated routes:

| Route | Purpose |
|-------|---------|
| `/pay` | Enter payment code |
| `/pay/[code]` | Pay / VA / QR |
| `/pay/checkout/[ref]` | Gateway fallback |
| `/pay/remita/[ref]` | Remita fallback |
| `/receipts/[id]` | Receipt |
| `/receipts/verify/[id]` | Verify receipt |

Set `PAY_URL` to the **web** app origin (same as `APP_URL`).

Do not deploy this package separately.
