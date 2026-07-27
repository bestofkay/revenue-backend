import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
