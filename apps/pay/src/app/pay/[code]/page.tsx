'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, CheckCircle2, Copy, Loader2, QrCode, RefreshCw, Landmark } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { formatDate, methodLabel } from '@/lib/utils';

type PaymentDetails = {
  paymentCode: string;
  paymentReference: string;
  revenueName: string;
  amountMinor: number;
  amountFormatted: string;
  currency: string;
  invoiceNumber: string;
  agency: { code: string; name: string };
  virtualAccount: {
    bank: string;
    bankCode?: string;
    accountNumber: string;
    accountName: string;
    status: string;
    expiresAt?: string;
  } | null;
  qrCode: string | null;
  payUrl?: string;
  expiresAt: string;
  status: string;
  methods: string[];
};

type SimulateResponse = {
  receipt?: { id?: string; receiptNumber?: string };
  payment?: { id?: string };
  alreadyPaid?: boolean;
};

function statusStyles(status: string) {
  if (status === 'PAID') return 'bg-accent/15 text-accent-700';
  if (status === 'EXPIRED' || status === 'FAILED' || status === 'REFUNDED') return 'bg-red-100 text-red-800';
  if (status === 'PROCESSING') return 'bg-blue-100 text-blue-800';
  return 'bg-amber-100 text-amber-900';
}

export default function PayByCodePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = decodeURIComponent(params.code);

  const [data, setData] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [simulateMsg, setSimulateMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const isProd = process.env.NODE_ENV === 'production';

  const load = useCallback(async () => {
    setError(null);
    try {
      void api(`/payments/${encodeURIComponent(code)}/click`, { method: 'POST' }).catch(() => null);
      const details = await api<PaymentDetails>(`/payments/${encodeURIComponent(code)}`);
      setData(details);
      return details;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load payment');
      return null;
    }
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!data || data.status === 'PAID' || data.status === 'EXPIRED' || data.status === 'FAILED') return;
    const timer = setInterval(() => {
      void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [data, load]);

  async function copyAccount() {
    if (!data?.virtualAccount?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(data.virtualAccount.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setSimulateMsg('Clipboard unavailable in this browser context');
    }
  }

  async function verifyPayment() {
    if (!data) return;
    setVerifying(true);
    setSimulateMsg(null);
    try {
      const result = await api<SimulateResponse>('/payments/verify', {
        method: 'POST',
        body: { reference: data.paymentReference },
      });
      const id = result.receipt?.id || result.receipt?.receiptNumber;
      if (id) setReceiptId(id);
      await load();
      setSimulateMsg(result.alreadyPaid ? 'Payment already confirmed.' : 'Payment verified.');
      if (id) setTimeout(() => router.push(`/receipts/${id}`), 800);
    } catch (err) {
      setSimulateMsg(err instanceof ApiError ? err.message : 'Verification pending — try again shortly');
      await load();
    } finally {
      setVerifying(false);
    }
  }

  async function simulatePayment() {
    if (!data) return;
    setSimulating(true);
    setSimulateMsg(null);
    try {
      const result = await api<SimulateResponse>('/payments/simulate', {
        method: 'POST',
        body: { paymentCode: data.paymentCode },
      });
      const id = result.receipt?.id || result.receipt?.receiptNumber;
      if (id) setReceiptId(id);
      setSimulateMsg(result.alreadyPaid ? 'Already paid — opening receipt.' : 'Payment simulated successfully.');
      await load();
      if (id) {
        setTimeout(() => router.push(`/receipts/${id}`), 800);
      }
    } catch (err) {
      setSimulateMsg(err instanceof ApiError ? err.message : 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-[color:var(--muted)]">
        <div className="h-9 w-9 rounded-full border-2 border-brass/40 border-t-accent animate-spin" />
        Loading secure payment…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
        <div className="animate-scale-in rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-panel">
          <h1 className="font-serif text-2xl">Payment unavailable</h1>
          <p className="mt-2 text-sm">{error || 'Unknown error'}</p>
          <p className="mt-2 text-xs text-red-700/80">
            Try a seeded code such as NCS202607000001 after running <code>pnpm db:seed</code>.
          </p>
          <button className="mt-4 text-sm underline" onClick={() => router.push('/')}>
            Enter another code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-8 md:py-12">
      <header className="mb-5 flex animate-fade-up flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy text-white seal-ring">
              <Landmark className="h-4 w-4" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brass-deep">Government Revenue Pay</p>
          </div>
          <h1 className="mt-1 break-words text-2xl text-navy sm:text-3xl md:text-4xl">{data.agency.name}</h1>
          <p className="mt-1 text-sm text-[color:var(--muted)]">{data.agency.code}</p>
        </div>
        <span
          className={`w-fit shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${statusStyles(data.status)}`}
        >
          {data.status}
        </span>
      </header>

      <div className="animate-scale-in overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white shadow-lift">
        <div className="border-b border-[color:var(--border)] bg-gradient-to-br from-navy via-navy to-navy-700 px-4 py-5 text-white sm:px-7">
          <p className="text-sm text-white/70">Amount due</p>
          <p className="mt-1 break-words font-serif text-3xl tracking-tight sm:text-4xl">
            {data.amountFormatted}
          </p>
          <p className="mt-2 break-words text-sm text-white/75">{data.revenueName}</p>
          <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-brass to-accent" />
        </div>

        <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-7">
          <div className="min-w-0 space-y-4">
            <Detail label="Invoice" value={data.invoiceNumber} />
            <Detail label="Payment code" value={data.paymentCode} />
            <Detail label="Reference" value={data.paymentReference} />
            <Detail label="Expires" value={formatDate(data.expiresAt)} />

            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-[color:var(--muted)]">Methods</p>
              <div className="flex flex-wrap gap-2">
                {(data.methods?.length ? data.methods : ['BANK_TRANSFER', 'DEBIT_CARD', 'USSD', 'QR']).map(
                  (m) => (
                    <span
                      key={m}
                      className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-2.5 py-1 text-xs font-medium text-navy"
                    >
                      {methodLabel(m)}
                    </span>
                  ),
                )}
              </div>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Prefer bank transfer to the virtual account below. Complete card or USSD payments via
                your bank or provider app.
              </p>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            {data.virtualAccount ? (
              <div className="rounded-xl border border-brass/25 bg-[color:var(--surface)] p-4">
                <div className="mb-3 flex items-center gap-2 text-navy">
                  <Building2 className="h-4 w-4 shrink-0 text-accent" />
                  <p className="text-sm font-medium">Virtual account</p>
                </div>
                <Detail label="Bank" value={data.virtualAccount.bank} />
                <Detail label="Account name" value={data.virtualAccount.accountName} />
                <Detail label="VA status" value={data.virtualAccount.status} />
                {data.virtualAccount.expiresAt && (
                  <Detail label="VA expires" value={formatDate(data.virtualAccount.expiresAt)} />
                )}
                <div className="mt-3">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">Account number</p>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                    <p className="break-all font-mono text-lg tracking-wide text-navy sm:text-xl">
                      {data.virtualAccount.accountNumber}
                    </p>
                    <button
                      type="button"
                      onClick={copyAccount}
                      className="inline-flex items-center gap-1 rounded-md border border-[color:var(--border)] bg-white px-2 py-1 text-xs transition hover:border-accent/40"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
                Virtual account not yet generated for this payment.
              </div>
            )}

            {data.qrCode?.startsWith('data:image') ? (
              <div className="rounded-xl border border-[color:var(--border)] p-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm text-navy">
                  <QrCode className="h-4 w-4" />
                  Scan to pay
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.qrCode}
                  alt="Payment QR code"
                  className="mx-auto h-40 w-40 rounded-md bg-white sm:h-44 sm:w-44"
                />
                <p className="mt-2 break-all text-[11px] text-[color:var(--muted)]">{data.payUrl}</p>
              </div>
            ) : data.payUrl ? (
              <div className="rounded-xl border border-dashed border-[color:var(--border)] p-4 text-sm text-[color:var(--muted)]">
                QR code is generating. Use payment link:{' '}
                <a className="text-accent underline break-all" href={data.payUrl}>
                  {data.payUrl}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-[color:var(--border)] px-4 py-4 sm:flex-row sm:flex-wrap sm:px-7">
          {data.status === 'PAID' ? (
            <button
              type="button"
              onClick={() => router.push(receiptId ? `/receipts/${receiptId}` : `/`)}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-600 sm:w-auto"
            >
              {receiptId ? 'View receipt' : 'Payment complete'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={verifyPayment}
                disabled={verifying}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-600 disabled:opacity-60 sm:w-auto"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                I have paid — verify
              </button>
              <button
                type="button"
                onClick={() => load()}
                className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[color:var(--border)] px-4 text-sm transition hover:bg-[color:var(--surface)] sm:w-auto"
              >
                Refresh status
              </button>
              {!isProd && data.status !== 'EXPIRED' && (
                <button
                  type="button"
                  onClick={simulatePayment}
                  disabled={simulating}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 whitespace-normal rounded-md bg-navy px-4 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-60 sm:w-auto"
                >
                  {simulating ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
                  Simulate payment (non-prod)
                </button>
              )}
            </>
          )}
          {simulateMsg && (
            <p className="w-full break-words text-sm text-[color:var(--muted)]">{simulateMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-navy">{value}</p>
    </div>
  );
}
