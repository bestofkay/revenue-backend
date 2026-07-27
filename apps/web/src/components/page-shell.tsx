'use client';

import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 animate-fade-up sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 h-0.5 w-10 rounded-full bg-gradient-to-r from-brass to-accent" />
        <h1 className="text-2xl text-navy dark:text-foreground sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="animate-fade-up rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <p className="break-words">{message}</p>
      {onRetry ? (
        <button className="mt-2 underline" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title = 'No records yet',
  description = 'Seed the database or create a new record to get started.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center animate-fade-in sm:px-6 sm:py-10">
      <p className="font-serif text-lg text-navy dark:text-foreground">{title}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty = 'No records found. Run pnpm db:seed to load NCS demo data.',
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, React.ReactNode>[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title="No records found" description={empty} />;
  }

  return (
    <div className="-mx-3 overflow-x-auto overscroll-x-contain px-3 sm:mx-0 sm:px-0 animate-fade-up">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-panel">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-gradient-to-r from-muted/70 to-muted/40">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-3 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground sm:px-4',
                      col.className,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border/80 transition-colors last:border-0 hover:bg-accent/[0.03]"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'max-w-[16rem] break-words px-3 py-3 align-top sm:max-w-none sm:px-4',
                        col.className,
                      )}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}
