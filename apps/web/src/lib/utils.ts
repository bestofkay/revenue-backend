import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amountMinor: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NG').format(value);
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function methodLabel(method: string) {
  switch (method) {
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'DEBIT_CARD':
    case 'CARD':
      return 'Card';
    case 'USSD':
      return 'USSD';
    case 'QR':
      return 'QR';
    default:
      return method.replaceAll('_', ' ');
  }
}
