export type Money = {
  amountMinor: number;
  currency: string;
};

export function toMinorUnits(amountMajor: number, currency = 'NGN'): number {
  if (!Number.isFinite(amountMajor)) {
    throw new Error('Invalid amount');
  }
  const decimals = currency === 'JPY' ? 0 : 2;
  return Math.round(amountMajor * 10 ** decimals);
}

export function fromMinorUnits(amountMinor: number, currency = 'NGN'): number {
  const decimals = currency === 'JPY' ? 0 : 2;
  return amountMinor / 10 ** decimals;
}

export function formatMoney(amountMinor: number, currency = 'NGN', locale = 'en-NG'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(fromMinorUnits(amountMinor, currency));
}

export function assertPositiveAmount(amountMinor: number): void {
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error('Amount must be a positive integer in minor units');
  }
}

export function amountsEqual(a: number, b: number): boolean {
  return a === b;
}
