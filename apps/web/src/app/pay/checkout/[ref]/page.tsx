'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Gateway adapters may redirect here; forward to the payment code page when possible. */
export default function CheckoutFallbackPage() {
  const params = useParams<{ ref: string }>();
  const router = useRouter();
  const ref = decodeURIComponent(params.ref);

  useEffect(() => {
    router.replace(`/pay/${encodeURIComponent(ref)}`);
  }, [ref, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-[color:var(--pay-muted)]">
      Redirecting to payment…
    </div>
  );
}
