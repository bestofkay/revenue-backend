import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const TOKEN_SEP = '|';

export function signHmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expected = signHmac(payload, secret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createPaymentToken(parts: {
  paymentCode: string;
  invoiceId: string;
  amountMinor: number;
  expiresAt: string;
  secret: string;
}): string {
  const body = [parts.paymentCode, parts.invoiceId, String(parts.amountMinor), parts.expiresAt].join(TOKEN_SEP);
  const sig = signHmac(body, parts.secret);
  return Buffer.from(`${body}${TOKEN_SEP}${sig}`).toString('base64url');
}

export function verifyPaymentToken(
  token: string,
  secret: string,
): { valid: boolean; paymentCode?: string; invoiceId?: string; amountMinor?: number; expiresAt?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastSep = decoded.lastIndexOf(TOKEN_SEP);
    if (lastSep <= 0) return { valid: false };

    const sig = decoded.slice(lastSep + 1);
    const body = decoded.slice(0, lastSep);
    const [paymentCode, invoiceId, amountMinor, expiresAt] = body.split(TOKEN_SEP);
    if (!paymentCode || !invoiceId || !amountMinor || !expiresAt || !sig) {
      return { valid: false };
    }
    if (!verifyHmac(body, sig, secret)) return { valid: false };
    if (new Date(expiresAt).getTime() < Date.now()) return { valid: false };
    return {
      valid: true,
      paymentCode,
      invoiceId,
      amountMinor: Number(amountMinor),
      expiresAt,
    };
  } catch {
    return { valid: false };
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
