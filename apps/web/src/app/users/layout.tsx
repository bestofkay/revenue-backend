'use client';

import { AdminShell } from '@/components/admin-shell';

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
