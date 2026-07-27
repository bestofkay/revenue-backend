import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaystackAdapter } from './paystack.adapter';

describe('PaystackAdapter', () => {
  let adapter: PaystackAdapter;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaystackAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def?: string) => {
              const map: Record<string, string> = {
                PAYSTACK_SECRET_KEY: 'sk_test_xxx',
                VA_BANK_CODE: '058',
                VA_BANK_NAME: 'GTBank',
                PAY_URL: 'http://localhost:3001',
              };
              return map[key] ?? def;
            },
          },
        },
      ],
    }).compile();
    adapter = moduleRef.get(PaystackAdapter);
  });

  it('creates sandbox virtual account', async () => {
    const va = await adapter.createVirtualAccount({
      agencyId: 'a1',
      agencyCode: 'NCS',
      invoiceNumber: 'INV-1',
      paymentReference: 'PR-1',
      amountMinor: 100000,
      currency: 'NGN',
      accountName: 'NCS / Test',
      expiresAt: new Date(Date.now() + 86400000),
    });
    expect(va.accountNumber).toMatch(/^9\d+$/);
    expect(va.bankCode).toBe('058');
    expect(va.providerRef).toContain('PSK_VA_');
  });

  it('parses charge success webhook', () => {
    const parsed = adapter.parseWebhook({
      event: 'charge.success',
      data: {
        id: 123,
        reference: 'PR-1',
        amount: 100000,
        currency: 'NGN',
        status: 'success',
      },
    });
    expect(parsed.status).toBe('success');
    expect(parsed.reference).toBe('PR-1');
    expect(parsed.amountMinor).toBe(100000);
  });
});
