# Entity Relationship Diagram

```mermaid
erDiagram
  Agency ||--o{ User : employs
  Agency ||--o{ RevenueType : defines
  Agency ||--o{ Assessment : owns
  Agency ||--o{ Invoice : issues
  Assessment ||--o{ AssessmentLine : contains
  Assessment ||--o| Invoice : becomes
  Invoice ||--o{ InvoiceLine : contains
  Invoice ||--o{ PaymentRequest : generates
  PaymentRequest ||--o| PaymentLink : has
  PaymentRequest ||--o| VirtualAccount : has
  PaymentRequest ||--o{ Payment : collects
  Payment ||--o| Receipt : issues
  Payment ||--o| Settlement : settles
  User ||--o{ UserRole : has
  Role ||--o{ RolePermission : grants
  Permission ||--o{ RolePermission : assigned
```

## Key uniqueness

- `PaymentRequest.paymentCode` globally unique
- `Invoice.invoiceNumber` unique per agency
- `VirtualAccount (accountNumber, bankCode)` unique
- `WebhookEvent (provider, providerEventId)` unique (idempotency)
- `Receipt.receiptNumber` unique per agency
