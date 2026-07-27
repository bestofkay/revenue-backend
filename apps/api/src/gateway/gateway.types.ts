import { PaymentMethod, PaymentProvider } from '@revenue/database';

export type CreateVirtualAccountInput = {
  agencyId: string;
  agencyCode: string;
  invoiceNumber: string;
  paymentReference: string;
  amountMinor: number;
  currency: string;
  accountName: string;
  payerEmail?: string;
  expiresAt: Date;
};

export type CreateVirtualAccountResult = {
  provider: PaymentProvider;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  providerRef: string;
  metadata?: Record<string, unknown>;
};

export type InitializeCheckoutInput = {
  amountMinor: number;
  currency: string;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  method?: PaymentMethod;
};

export type InitializeCheckoutResult = {
  provider: PaymentProvider;
  authorizationUrl?: string;
  accessCode?: string;
  providerRef: string;
  raw?: unknown;
};

export type VerifyPaymentInput = {
  reference: string;
};

export type VerifyPaymentResult = {
  success: boolean;
  amountMinor: number;
  currency: string;
  providerRef: string;
  paidAt?: Date;
  method?: PaymentMethod;
  raw?: unknown;
};

export interface PaymentGatewayAdapter {
  readonly provider: PaymentProvider;
  createVirtualAccount(input: CreateVirtualAccountInput): Promise<CreateVirtualAccountResult>;
  initializeCheckout(input: InitializeCheckoutInput): Promise<InitializeCheckoutResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(headers: Record<string, string | string[] | undefined>, rawBody: Buffer | string): boolean;
  parseWebhook(payload: unknown): {
    eventId: string;
    eventType: string;
    reference: string;
    amountMinor?: number;
    currency?: string;
    status: 'success' | 'failed' | 'pending';
    accountNumber?: string;
  };
}
