export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
}

export enum AgencyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  INVOICED = 'INVOICED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum VirtualAccountStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
  SETTLED = 'SETTLED',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  DEBIT_CARD = 'DEBIT_CARD',
  USSD = 'USSD',
  QR = 'QR',
  POS = 'POS',
  WALLET = 'WALLET',
  MOBILE_MONEY = 'MOBILE_MONEY',
  INTERNATIONAL = 'INTERNATIONAL',
}

export enum PaymentProvider {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  REMITA = 'REMITA',
  INTERNAL = 'INTERNAL',
}

export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum LinkEventType {
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  SHARED = 'SHARED',
}

export enum ApprovalAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RETURN = 'RETURN',
}

export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  CONFIG = 'CONFIG',
  ROLE_CHANGE = 'ROLE_CHANGE',
  RECEIPT = 'RECEIPT',
  ASSESSMENT = 'ASSESSMENT',
  INVOICE = 'INVOICE',
}

export const PERMISSIONS = [
  'agencies:read',
  'agencies:write',
  'users:read',
  'users:write',
  'roles:read',
  'roles:write',
  'revenue:read',
  'revenue:write',
  'assessments:read',
  'assessments:write',
  'assessments:approve',
  'invoices:read',
  'invoices:write',
  'payments:read',
  'payments:write',
  'payments:refund',
  'settlements:read',
  'settlements:write',
  'receipts:read',
  'reports:read',
  'audit:read',
  'notifications:write',
  'gateways:write',
  'api_keys:write',
] as const;

export type PermissionCode = (typeof PERMISSIONS)[number];
