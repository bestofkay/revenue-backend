'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Remita checkout fallback — routes back into the standard pay experience. */
export default function RemitaFallbackPage() {
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
