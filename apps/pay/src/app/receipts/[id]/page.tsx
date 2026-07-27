'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Printer, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type Receipt = {
  id: string;
  receiptNumber: string;
  amountMinor?: number;
  currency?: string;
  issuedAt?: string;
  createdAt?: string;
  digitalSignature?: string | null;
  qrVerification?: string | null;
  paymentReference?: string;
  invoiceNumber?: string;
  agencyName?: string;
  agency?: { name?: string; code?: string };
  invoice?: { invoiceNumber?: string; payerName?: string };
  payment?: {
    amountMinor?: number;
    currency?: string;
    paidAt?: string;
    providerRef?: string | null;
    paymentRequest?: { paymentCode?: string; paymentReference?: string };
  };
};

function formatMoney(amountMinor: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amountMinor / 100);
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id);

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api<Receipt>(`/receipts/${encodeURIComponent(id)}`);
        if (!cancelled) setReceipt(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Unable to load receipt');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-[color:var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading receipt…
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="font-serif text-2xl">Receipt unavailable</h1>
          <p className="mt-2 text-sm">{error || 'Unknown error'}</p>
          <button className="mt-4 text-sm underline" onClick={() => router.push('/')}>
            Back to pay portal
          </button>
        </div>
      </div>
    );
  }

  const amountMinor = receipt.amountMinor ?? receipt.payment?.amountMinor ?? 0;
  const currency = receipt.currency ?? receipt.payment?.currency ?? 'NGN';
  const agencyTitle = receipt.agencyName || receipt.agency?.name || 'Government Revenue';

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-3 py-8 sm:px-4 sm:py-10">
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-panel print:shadow-none">
        <div className="flex flex-col gap-4 border-b border-[color:var(--border)] bg-gradient-to-br from-navy via-navy to-navy-700 px-4 py-5 text-white sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brass-soft">Official receipt</p>
            <h1 className="mt-1 break-words font-serif text-2xl sm:text-3xl">{agencyTitle}</h1>
            <p className="mt-1 text-sm text-white/70">{receipt.agency?.code}</p>
            <div className="mt-3 h-0.5 w-14 rounded-full bg-gradient-to-r from-brass to-accent" />
          </div>
          <CheckCircle2 className="h-8 w-8 shrink-0 text-accent-100" />
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <div className="rounded-xl bg-[color:var(--surface)] p-4">
            <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Amount paid</p>
            <p className="mt-1 break-words font-serif text-3xl text-navy sm:text-4xl">
              {formatMoney(amountMinor, currency)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Receipt number" value={receipt.receiptNumber} />
            <Field label="Issued" value={formatDate(receipt.issuedAt || receipt.createdAt)} />
            <Field label="Invoice" value={receipt.invoiceNumber || receipt.invoice?.invoiceNumber || '—'} />
            <Field label="Payer" value={receipt.invoice?.payerName || '—'} />
            <Field
              label="Payment code"
              value={receipt.payment?.paymentRequest?.paymentCode || '—'}
            />
            <Field
              label="Payment reference"
              value={
                receipt.paymentReference ||
                receipt.payment?.paymentRequest?.paymentReference ||
                receipt.payment?.providerRef ||
                '—'
              }
            />
            <Field label="Provider ref" value={receipt.payment?.providerRef || '—'} />
          </div>

          {receipt.qrVerification ? (
            <div className="rounded-lg border border-[color:var(--border)] p-4 text-center">
              <div className="mb-2 flex items-center justify-center gap-2 text-sm text-navy">
                <ShieldCheck className="h-4 w-4" />
                Verification QR
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.qrVerification}
                alt="Receipt verification QR"
                className="mx-auto h-32 w-32 sm:h-36 sm:w-36"
              />
              <button
                type="button"
                className="mt-2 text-xs text-accent underline"
                onClick={() => router.push(`/receipts/verify/${encodeURIComponent(receipt.receiptNumber)}`)}
              >
                Open verification page
              </button>
            </div>
          ) : null}

          {receipt.digitalSignature ? (
            <div className="rounded-lg border border-[color:var(--border)] p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Digital signature</p>
              <p className="mt-1 break-all font-mono text-[11px] text-[color:var(--muted)]">
                {receipt.digitalSignature}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white hover:bg-accent-600 sm:w-auto"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[color:var(--border)] px-4 text-sm sm:w-auto"
            >
              New payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-navy">{value}</p>
    </div>
  );
}
