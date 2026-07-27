import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Government Revenue Pay',
  description: 'Public payment portal for Government Revenue collection',
};

/** Public pay portal — no admin chrome / auth shell. */
export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
