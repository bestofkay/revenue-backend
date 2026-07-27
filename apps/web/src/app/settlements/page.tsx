'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataTable, ErrorState, Label, PageHeader } from '@/components/page-shell';

type Settlement = {
  id: string;
  amountMinor?: number;
  status: string;
  createdAt?: string;
  paymentReference?: string;
};

type Batch = {
  id: string;
  batchNumber?: string;
  status: string;
  totalMinor?: number;
  createdAt?: string;
  tsaReference?: string | null;
};

export default function SettlementsPage() {
  const [settleId, setSettleId] = useState<string | null>(null);
  const [tsaReference, setTsaReference] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const settlements = useQuery({
    queryKey: ['settlements'],
    queryFn: () => api<Settlement[]>('/settlements'),
  });
  const batches = useQuery({
    queryKey: ['settlement-batches'],
    queryFn: () => api<Batch[]>('/settlements/batches'),
  });

  const createBatch = useMutation({
    mutationFn: () => api('/settlements/batches', { method: 'POST' }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['settlements'] }),
        queryClient.invalidateQueries({ queryKey: ['settlement-batches'] }),
      ]);
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Batch create failed'),
  });

  const settleBatch = useMutation({
    mutationFn: () =>
      api(`/settlements/batches/${settleId}/settle`, {
        method: 'POST',
        body: { tsaReference },
      }),
    onSuccess: async () => {
      setSettleId(null);
      setTsaReference('');
      await queryClient.invalidateQueries({ queryKey: ['settlement-batches'] });
    },
    onError: (err) => setActionError(err instanceof ApiError ? err.message : 'Settle failed'),
  });

  return (
    <div>
      <PageHeader
        title="Settlements"
        description="Treasury settlement batches and line items"
        actions={
          <Button onClick={() => createBatch.mutate()} disabled={createBatch.isPending}>
            {createBatch.isPending ? 'Creating…' : 'Create batch'}
          </Button>
        }
      />

      {actionError && <div className="mb-4"><ErrorState message={actionError} /></div>}

      {settleId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mark batch settled</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tsa">TSA reference</Label>
              <Input id="tsa" value={tsaReference} onChange={(e) => setTsaReference(e.target.value)} />
            </div>
            <Button
              onClick={() => settleBatch.mutate()}
              disabled={!tsaReference || settleBatch.isPending}
            >
              Confirm
            </Button>
            <Button variant="ghost" onClick={() => setSettleId(null)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-3 font-serif text-xl">Batches</h2>
      {batches.isLoading && <p className="mb-6 text-sm text-muted-foreground">Loading batches…</p>}
      {batches.error && (
        <ErrorState
          message={batches.error instanceof Error ? batches.error.message : 'Failed to load batches'}
          onRetry={() => batches.refetch()}
        />
      )}
      {batches.data && (
        <div className="mb-8">
          <DataTable
            columns={[
              { key: 'number', label: 'Batch' },
              { key: 'amount', label: 'Total' },
              { key: 'status', label: 'Status' },
              { key: 'created', label: 'Created' },
              { key: 'actions', label: '' },
            ]}
            rows={batches.data.map((b) => ({
              number: b.batchNumber || b.id.slice(0, 8),
              amount: formatMoney(b.totalMinor ?? 0),
              status: (
                <Badge variant={b.status === 'SETTLED' ? 'success' : 'warning'}>{b.status}</Badge>
              ),
              created: formatDate(b.createdAt),
              actions:
                b.status === 'PENDING' ? (
                  <Button size="sm" variant="outline" onClick={() => setSettleId(b.id)}>
                    Settle
                  </Button>
                ) : (
                  b.tsaReference || '—'
                ),
            }))}
          />
        </div>
      )}

      <h2 className="mb-3 font-serif text-xl">Settlement lines</h2>
      {settlements.isLoading && <p className="text-sm text-muted-foreground">Loading settlements…</p>}
      {settlements.error && (
        <ErrorState
          message={settlements.error instanceof Error ? settlements.error.message : 'Failed to load'}
          onRetry={() => settlements.refetch()}
        />
      )}
      {settlements.data && (
        <DataTable
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'ref', label: 'Reference' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'created', label: 'Created' },
          ]}
          rows={settlements.data.map((s) => ({
            id: s.id.slice(0, 8),
            ref: s.paymentReference || '—',
            amount: formatMoney(s.amountMinor ?? 0),
            status: <Badge variant="outline">{s.status}</Badge>,
            created: formatDate(s.createdAt),
          }))}
        />
      )}
    </div>
  );
}
