'use client';

import { FileBarChart2 } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type ReportMeta = {
  type?: string;
  code?: string;
  title: string;
  subtitle: string;
  category?: string;
  audience?: string;
  standards?: string[];
  agency: { code: string; name: string; shortName?: string | null };
  period: string;
  start: string;
  end: string;
  generatedAt: string;
  currency: string;
  classification: string;
};

export const PERIODS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'annual', label: 'Annual' },
] as const;

export const CHART_COLORS = ['#0C6B45', '#081A30', '#B89A4F', '#3D6A9A', '#8A7033', '#4FB885', '#6F93BD'];

export function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Number(((part / whole) * 100).toFixed(1));
}

export function shareBar(value: number, max: number) {
  const width = max <= 0 ? 0 : Math.max(4, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${width}%` }} />
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'good'
      ? 'border-accent/30'
      : tone === 'warn'
        ? 'border-brass/40'
        : tone === 'danger'
          ? 'border-red-300'
          : 'border-border';
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-panel', toneClass)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 font-serif text-2xl tracking-tight text-navy dark:text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brass-deep">{eyebrow}</p>
      ) : null}
      <h2 className="font-serif text-xl text-navy dark:text-foreground">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function ReportMasthead({
  meta,
  summary,
}: {
  meta: ReportMeta;
  summary?: React.ReactNode;
}) {
  const docId = `RCP-${meta.code ?? meta.agency.code}-${String(meta.period).toUpperCase().slice(0, 3)}-${new Date(
    meta.generatedAt,
  )
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')}`;

  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-navy text-white seal-ring">
              <FileBarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-brass-deep">
                {meta.agency.code} · {meta.category ?? 'Revenue Intelligence'}
              </p>
              <p className="font-serif text-lg text-navy dark:text-foreground">{meta.agency.name}</p>
            </div>
          </div>
          <h1 className="font-serif text-2xl text-navy dark:text-foreground sm:text-3xl">{meta.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{meta.subtitle}</p>
          {meta.audience ? (
            <p className="mt-2 text-xs text-muted-foreground">Audience: {meta.audience}</p>
          ) : null}
          {summary ? <div className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/80">{summary}</div> : null}
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Doc · {docId}</p>
          <p>
            <span className="text-muted-foreground">Period</span>{' '}
            <span className="font-medium capitalize">{meta.period}</span>
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">Coverage</span> {formatDate(meta.start)} —{' '}
            {formatDate(meta.end)}
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">Generated</span> {formatDate(meta.generatedAt)}
          </p>
          <p className="mt-1">
            <span className="text-muted-foreground">Currency</span> {meta.currency}
          </p>
          <Badge className="mt-2" variant="outline">
            {meta.classification}
          </Badge>
        </div>
      </div>
      {meta.standards?.length ? (
        <p className="mt-4 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          Aligned to: {meta.standards.join(' · ')}
        </p>
      ) : null}
    </header>
  );
}

export function ReportFooter({ meta }: { meta: ReportMeta }) {
  return (
    <footer className="border-t border-border pt-6 text-xs text-muted-foreground">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="font-medium text-foreground">Prepared by</p>
          <p className="mt-6 border-b border-border pb-1">System-generated · {meta.agency.code}</p>
          <p className="mt-1">Revenue Collection Console</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Reviewed by</p>
          <p className="mt-6 border-b border-border pb-1">&nbsp;</p>
          <p className="mt-1">Treasury / Finance sign-off</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Notes</p>
          <p className="mt-2 leading-relaxed">
            Figures reflect ledger and payment status at generation time. Outstanding and pending balances are
            point-in-time and may change after print.
          </p>
        </div>
      </div>
      <p className="mt-6 text-center tracking-wide">{meta.classification}</p>
    </footer>
  );
}

export function DataTable({
  headers,
  children,
  empty,
  colSpan,
}: {
  headers: { label: string; align?: 'left' | 'right' }[];
  children: React.ReactNode;
  empty?: boolean;
  colSpan: number;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            {headers.map((h) => (
              <th
                key={h.label}
                className={cn(
                  'px-3 py-3 text-[11px] uppercase tracking-wider text-muted-foreground',
                  h.align === 'right' && 'text-right',
                )}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
                No rows for this period.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
