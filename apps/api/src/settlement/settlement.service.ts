import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, LedgerEntryType, SettlementStatus } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AbacService } from '../common/services/abac.service';
import { SequenceService } from '../common/services/sequence.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class SettlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly abac: AbacService,
    private readonly sequences: SequenceService,
  ) {}

  async recordPaymentSettlement(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { agency: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    const existing = await this.prisma.settlement.findUnique({ where: { paymentId } });
    if (existing) return existing;

    const tsa = await this.prisma.tsaMapping.findFirst({
      where: { agencyId: payment.agencyId, isDefault: true },
    });

    const settlement = await this.prisma.settlement.create({
      data: {
        agencyId: payment.agencyId,
        paymentId: payment.id,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        status: SettlementStatus.PENDING,
        tsaAccount: tsa?.tsaAccountNumber,
      },
    });

    await this.prisma.ledgerEntry.createMany({
      data: [
        {
          agencyId: payment.agencyId,
          paymentId: payment.id,
          entryType: LedgerEntryType.DEBIT,
          accountCode: '1000-CASH-CLEARING',
          amountMinor: payment.amountMinor,
          currency: payment.currency,
          narrative: `Payment received ${payment.providerRef ?? payment.id}`,
        },
        {
          agencyId: payment.agencyId,
          paymentId: payment.id,
          entryType: LedgerEntryType.CREDIT,
          accountCode: tsa?.tsaAccountNumber ?? '2000-TSA-REVENUE',
          amountMinor: payment.amountMinor,
          currency: payment.currency,
          narrative: `TSA liability ${payment.agency.code}`,
        },
      ],
    });

    await this.audit.log({
      agencyId: payment.agencyId,
      action: AuditAction.PAYMENT,
      entityType: 'Settlement',
      entityId: settlement.id,
      after: settlement,
    });

    return settlement;
  }

  async createBatch(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    const pending = await this.prisma.settlement.findMany({
      where: { agencyId: resolved, status: SettlementStatus.PENDING, batchId: null },
    });
    if (!pending.length) return { message: 'No pending settlements', batch: null };

    const year = new Date().getUTCFullYear();
    const seq = await this.sequences.next(resolved, 'SETTLEMENT_BATCH', year);
    const totalMinor = pending.reduce((s, p) => s + p.amountMinor, 0);
    const batch = await this.prisma.settlementBatch.create({
      data: {
        agencyId: resolved,
        batchNumber: `STB-${year}-${String(seq).padStart(6, '0')}`,
        totalMinor,
        currency: pending[0]?.currency ?? 'NGN',
        status: SettlementStatus.PROCESSING,
        settlements: {
          connect: pending.map((p) => ({ id: p.id })),
        },
      },
      include: { settlements: true },
    });

    await this.prisma.settlement.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { status: SettlementStatus.PROCESSING, batchId: batch.id },
    });

    return batch;
  }

  async markBatchSettled(actor: AuthUser, batchId: string, tsaReference: string) {
    const batch = await this.prisma.settlementBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');
    this.abac.assertAgencyAccess(actor, batch.agencyId);

    const updated = await this.prisma.settlementBatch.update({
      where: { id: batchId },
      data: {
        status: SettlementStatus.SETTLED,
        tsaReference,
        settledAt: new Date(),
      },
    });
    await this.prisma.settlement.updateMany({
      where: { batchId },
      data: { status: SettlementStatus.SETTLED, settledAt: new Date() },
    });
    await this.audit.log({
      agencyId: batch.agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'SettlementBatch',
      entityId: batchId,
      after: { tsaReference, status: 'SETTLED' },
    });
    return updated;
  }

  async list(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.settlement.findMany({
      where: { agencyId: resolved },
      include: { payment: true, batch: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listBatches(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.settlementBatch.findMany({
      where: { agencyId: resolved },
      include: { settlements: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
