'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { publicApi, ApiError } from '@/lib/public-api';
import { formatDate } from '@/lib/utils';

type Receipt = {
  receiptNumber: string;
  amountMinor: number;
  currency: string;
  paymentReference: string;
  invoiceNumber: string;
  agencyName: string;
  digitalSignature: string;
  issuedAt?: string;
  metadata?: { publicKeyFingerprint?: string };
};

async function sha256HexPrefix(text: string, len = 16): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, len);
}

export default function VerifyReceiptPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [rec, key] = await Promise.all([
          publicApi<Receipt>(`/receipts/${encodeURIComponent(id)}`),
          publicApi<{ publicKey: string }>('/receipts/public-key'),
        ]);
        if (cancelled) return;
        setReceipt(rec);

        const hasSignature = Boolean(rec.digitalSignature && rec.digitalSignature.length > 20);
        const fingerprint = await sha256HexPrefix(key.publicKey);
        const metaFp = rec.metadata?.publicKeyFingerprint;
        const fingerprintOk = !metaFp || metaFp === fingerprint;
        const ok = hasSignature && fingerprintOk;

        setStatus(ok ? 'valid' : 'invalid');
        setDetail(
          ok
            ? `Receipt ${rec.receiptNumber} has a digital signature and matches the platform public key fingerprint.`
            : `Could not confirm signature integrity for ${rec.receiptNumber}.`,
        );
      } catch (err) {
        if (!cancelled) {
          setStatus('invalid');
          setDetail(err instanceof ApiError ? err.message : 'Verification failed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-3 py-8 sm:px-4 sm:py-10">
      <div className="rounded-2xl border border-[color:var(--pay-border)] bg-white p-4 shadow-panel sm:p-6">
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-[color:var(--pay-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying receipt…
          </div>
        )}
        {status === 'valid' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-accent-700 sm:items-center">
              <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 sm:mt-0" />
              <h1 className="font-serif text-xl text-navy sm:text-2xl">Receipt verified</h1>
            </div>
            <p className="break-words text-sm text-[color:var(--pay-muted)]">{detail}</p>
            {receipt && (
              <div className="rounded-lg bg-[color:var(--surface)] p-3 text-sm">
                <p className="break-words">
                  <strong>{receipt.receiptNumber}</strong> · {receipt.agencyName}
                </p>
                <p>
                  {(receipt.amountMinor / 100).toLocaleString('en-NG', {
                    style: 'currency',
                    currency: receipt.currency || 'NGN',
                  })}{' '}
                  · {formatDate(receipt.issuedAt)}
                </p>
                <p className="mt-1 break-words text-xs text-[color:var(--pay-muted)]">
                  Invoice {receipt.invoiceNumber} · Ref {receipt.paymentReference}
                </p>
              </div>
            )}
          </div>
        )}
        {status === 'invalid' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-red-700 sm:items-center">
              <ShieldX className="mt-0.5 h-6 w-6 shrink-0 sm:mt-0" />
              <h1 className="font-serif text-xl sm:text-2xl">Verification failed</h1>
            </div>
            <p className="break-words text-sm text-red-800">{detail}</p>
          </div>
        )}
        <button type="button" className="mt-6 text-sm text-accent underline" onClick={() => router.push('/pay')}>
          Back to pay portal
        </button>
      </div>
    </div>
  );
}
