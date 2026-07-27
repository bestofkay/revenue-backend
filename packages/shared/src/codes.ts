import { customAlphabet } from 'nanoid';

const alphaNum = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
const numeric = customAlphabet('0123456789', 6);

export type PaymentCodeStyle = 'AGENCY_DATE_SEQ' | 'REV_PREFIX' | 'CUS_YEAR';

/**
 * Globally unique payment code generators.
 * Sequence must be supplied by the caller (DB atomic counter) for AGENCY_DATE_SEQ.
 */
export function generatePaymentCode(input: {
  style?: PaymentCodeStyle;
  agencyCode: string;
  sequence?: number;
  year?: number;
  month?: number;
}): string {
  const style = input.style ?? 'AGENCY_DATE_SEQ';
  const year = input.year ?? new Date().getUTCFullYear();
  const month = String(input.month ?? new Date().getUTCMonth() + 1).padStart(2, '0');
  const agency = input.agencyCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);

  if (style === 'REV_PREFIX') {
    return `REV-${agency}-${alphaNum()}`;
  }

  if (style === 'CUS_YEAR') {
    return `CUS-${year}-${alphaNum()}`;
  }

  const seq = String(input.sequence ?? Number(numeric())).padStart(6, '0');
  return `${agency}${year}${month}${seq}`;
}

export function generateInvoiceNumber(agencyCode: string, year: number, sequence: number): string {
  const agency = agencyCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
  return `INV-${agency}-${year}-${String(sequence).padStart(8, '0')}`;
}

export function generateReceiptNumber(agencyCode: string, year: number, sequence: number): string {
  const agency = agencyCode.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
  return `RCT-${agency}-${year}-${String(sequence).padStart(8, '0')}`;
}

export function generatePaymentReference(prefix = 'PR'): string {
  return `${prefix}-${Date.now()}-${alphaNum()}`;
}
