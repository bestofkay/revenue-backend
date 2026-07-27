import { generatePaymentCode, generateInvoiceNumber, generateReceiptNumber } from '../src/codes';
import { createPaymentToken, verifyPaymentToken, signHmac, verifyHmac } from '../src/hmac';
import { toMinorUnits, fromMinorUnits, amountsEqual } from '../src/money';

describe('payment codes', () => {
  it('generates agency date sequence codes', () => {
    const code = generatePaymentCode({
      style: 'AGENCY_DATE_SEQ',
      agencyCode: 'NCS',
      sequence: 1,
      year: 2026,
      month: 7,
    });
    expect(code).toBe('NCS202607000001');
  });

  it('generates REV and CUS styles', () => {
    expect(generatePaymentCode({ style: 'REV_PREFIX', agencyCode: 'PORT' })).toMatch(/^REV-PORT-[A-Z0-9]+$/);
    expect(generatePaymentCode({ style: 'CUS_YEAR', agencyCode: 'CUS', year: 2026 })).toMatch(/^CUS-2026-[A-Z0-9]+$/);
  });

  it('generates invoice and receipt numbers', () => {
    expect(generateInvoiceNumber('NCS', 2026, 12)).toBe('INV-NCS-2026-00000012');
    expect(generateReceiptNumber('NCS', 2026, 9)).toBe('RCT-NCS-2026-00000009');
  });
});

describe('hmac tokens', () => {
  const secret = 'test-secret-key-at-least-32-chars!!';

  it('signs and verifies payment tokens', () => {
    const token = createPaymentToken({
      paymentCode: 'NCS202607000001',
      invoiceId: 'inv_1',
      amountMinor: 100000,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      secret,
    });
    const result = verifyPaymentToken(token, secret);
    expect(result.valid).toBe(true);
    expect(result.paymentCode).toBe('NCS202607000001');
    expect(result.amountMinor).toBe(100000);
  });

  it('rejects tampered hmac', () => {
    const sig = signHmac('payload', secret);
    expect(verifyHmac('payload', sig, secret)).toBe(true);
    expect(verifyHmac('payload', '0'.repeat(sig.length), secret)).toBe(false);
  });
});

describe('money', () => {
  it('converts major/minor units', () => {
    expect(toMinorUnits(1500.5, 'NGN')).toBe(150050);
    expect(fromMinorUnits(150050, 'NGN')).toBe(1500.5);
    expect(amountsEqual(100, 100)).toBe(true);
  });
});
