'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DataTable, ErrorState, PageHeader } from '@/components/page-shell';

type AuditPage = {
  items?: AuditItem[];
  data?: AuditItem[];
  total?: number;
};

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  actorId?: string | null;
  createdAt: string;
  ipAddress?: string | null;
};

export default function AuditPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const res = await api<AuditPage | AuditItem[]>('/audit?page=1&limit=50');
      if (Array.isArray(res)) return res;
      return res.items ?? res.data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Audit" description="Immutable activity log across the platform" />

      {isLoading && <p className="text-sm text-muted-foreground">Loading audit trail…</p>}
      {error && (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load audit log'}
          onRetry={() => refetch()}
        />
      )}
      {data && (
        <DataTable
          columns={[
            { key: 'when', label: 'When' },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Entity' },
            { key: 'actor', label: 'Actor' },
            { key: 'ip', label: 'IP' },
          ]}
          rows={data.map((row) => ({
            when: formatDate(row.createdAt),
            action: <Badge variant="outline">{row.action}</Badge>,
            entity: `${row.entityType}${row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ''}`,
            actor: row.actorId?.slice(0, 8) || '—',
            ip: row.ipAddress || '—',
          }))}
        />
      )}
    </div>
  );
}
