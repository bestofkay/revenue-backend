import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AbacService } from '../common/services/abac.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateCategoryDto,
  CreateFeeScheduleDto,
  CreateRevenueTypeDto,
  CreateTaxTypeDto,
  UpdateCategoryDto,
  UpdateFeeScheduleDto,
  UpdateRevenueTypeDto,
  UpdateTaxTypeDto,
} from './dto/revenue.dto';

type FeeLike = { amountMinor: number; name: string; isActive: boolean; effectiveFrom: Date };

function pickDefaultAmountMinor(feeSchedules: FeeLike[]): number | null {
  if (!feeSchedules.length) return null;
  const ranked = [...feeSchedules].sort((a, b) => {
    if (a.name.toLowerCase() === 'standard' && b.name.toLowerCase() !== 'standard') return -1;
    if (b.name.toLowerCase() === 'standard' && a.name.toLowerCase() !== 'standard') return 1;
    return b.effectiveFrom.getTime() - a.effectiveFrom.getTime();
  });
  return ranked[0]?.amountMinor ?? null;
}

@Injectable()
export class RevenueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly abac: AbacService,
  ) {}

  async createCategory(actor: AuthUser, dto: CreateCategoryDto) {
    const agencyId = this.abac.resolveAgencyId(actor, dto.agencyId);
    const category = await this.prisma.revenueCategory.create({
      data: {
        agencyId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
      },
    });
    await this.audit.log({
      agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'RevenueCategory',
      entityId: category.id,
      after: category,
    });
    return category;
  }

  async updateCategory(actor: AuthUser, id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.revenueCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    this.abac.assertAgencyAccess(actor, existing.agencyId);

    const category = await this.prisma.revenueCategory.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.audit.log({
      agencyId: existing.agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'RevenueCategory',
      entityId: category.id,
      before: existing,
      after: category,
    });
    return category;
  }

  async createType(actor: AuthUser, dto: CreateRevenueTypeDto) {
    const agencyId = this.abac.resolveAgencyId(actor, dto.agencyId);
    const category = await this.prisma.revenueCategory.findFirst({
      where: { id: dto.categoryId, agencyId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const type = await this.prisma.revenueType.create({
      data: {
        agencyId,
        categoryId: dto.categoryId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        glCode: dto.glCode,
        feeSchedules:
          dto.defaultAmountMinor && dto.defaultAmountMinor > 0
            ? {
                create: {
                  name: 'Standard',
                  amountMinor: dto.defaultAmountMinor,
                  currency: 'NGN',
                  effectiveFrom: new Date(),
                },
              }
            : undefined,
      },
      include: { feeSchedules: true, category: true },
    });

    await this.audit.log({
      agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'RevenueType',
      entityId: type.id,
      after: type,
    });
    return {
      ...type,
      defaultAmountMinor: pickDefaultAmountMinor(type.feeSchedules),
    };
  }

  async updateType(actor: AuthUser, id: string, dto: UpdateRevenueTypeDto) {
    const existing = await this.prisma.revenueType.findUnique({
      where: { id },
      include: { feeSchedules: { where: { isActive: true } } },
    });
    if (!existing) throw new NotFoundException('Revenue type not found');
    this.abac.assertAgencyAccess(actor, existing.agencyId);

    if (dto.categoryId) {
      const category = await this.prisma.revenueCategory.findFirst({
        where: { id: dto.categoryId, agencyId: existing.agencyId },
      });
      if (!category) throw new NotFoundException('Category not found');
    }

    const type = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.revenueType.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          code: dto.code ? dto.code.toUpperCase() : undefined,
          name: dto.name,
          description: dto.description,
          glCode: dto.glCode,
          isActive: dto.isActive,
        },
        include: { feeSchedules: { where: { isActive: true } }, category: true },
      });

      if (dto.defaultAmountMinor !== undefined) {
        const standard =
          updated.feeSchedules.find((f) => f.name.toLowerCase() === 'standard') ??
          updated.feeSchedules[0];

        if (dto.defaultAmountMinor <= 0) {
          if (standard) {
            await tx.feeSchedule.update({
              where: { id: standard.id },
              data: { isActive: false },
            });
          }
        } else if (standard) {
          await tx.feeSchedule.update({
            where: { id: standard.id },
            data: { amountMinor: dto.defaultAmountMinor, isActive: true },
          });
        } else {
          await tx.feeSchedule.create({
            data: {
              revenueTypeId: id,
              name: 'Standard',
              amountMinor: dto.defaultAmountMinor,
              currency: 'NGN',
              effectiveFrom: new Date(),
              isActive: true,
            },
          });
        }
      }

      return tx.revenueType.findUniqueOrThrow({
        where: { id },
        include: { feeSchedules: { where: { isActive: true } }, category: true },
      });
    });

    await this.audit.log({
      agencyId: existing.agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'RevenueType',
      entityId: type.id,
      before: existing,
      after: type,
    });

    return {
      ...type,
      defaultAmountMinor: pickDefaultAmountMinor(type.feeSchedules),
    };
  }

  async addFee(actor: AuthUser, dto: CreateFeeScheduleDto) {
    const type = await this.prisma.revenueType.findUnique({ where: { id: dto.revenueTypeId } });
    if (!type) throw new NotFoundException('Revenue type not found');
    this.abac.assertAgencyAccess(actor, type.agencyId);
    return this.prisma.feeSchedule.create({
      data: {
        revenueTypeId: dto.revenueTypeId,
        name: dto.name,
        amountMinor: dto.amountMinor,
        currency: dto.currency ?? 'NGN',
        effectiveFrom: new Date(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateFee(actor: AuthUser, id: string, dto: UpdateFeeScheduleDto) {
    const existing = await this.prisma.feeSchedule.findUnique({
      where: { id },
      include: { revenueType: true },
    });
    if (!existing) throw new NotFoundException('Fee schedule not found');
    this.abac.assertAgencyAccess(actor, existing.revenueType.agencyId);

    const fee = await this.prisma.feeSchedule.update({
      where: { id },
      data: {
        name: dto.name,
        amountMinor: dto.amountMinor,
        currency: dto.currency,
        isActive: dto.isActive,
      },
      include: { revenueType: true },
    });

    await this.audit.log({
      agencyId: existing.revenueType.agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'FeeSchedule',
      entityId: fee.id,
      before: existing,
      after: fee,
    });
    return fee;
  }

  async listCategories(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.revenueCategory.findMany({
      where: { agencyId: resolved, isActive: true },
      include: { revenueTypes: { include: { feeSchedules: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async listTypes(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    const types = await this.prisma.revenueType.findMany({
      where: { agencyId: resolved, isActive: true },
      include: { category: true, feeSchedules: { where: { isActive: true } } },
      orderBy: { name: 'asc' },
    });
    return types.map((t) => ({
      ...t,
      defaultAmountMinor: pickDefaultAmountMinor(t.feeSchedules),
    }));
  }

  async listFees(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.feeSchedule.findMany({
      where: { revenueType: { agencyId: resolved }, isActive: true },
      include: { revenueType: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async createTaxType(actor: AuthUser, dto: CreateTaxTypeDto) {
    const agencyId = this.abac.resolveAgencyId(actor, dto.agencyId);
    const tax = await this.prisma.taxType.create({
      data: {
        agencyId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        description: dto.description,
        ratePercent: dto.ratePercent,
      },
    });
    await this.audit.log({
      agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'TaxType',
      entityId: tax.id,
      after: tax,
    });
    return { ...tax, ratePercent: Number(tax.ratePercent) };
  }

  async updateTaxType(actor: AuthUser, id: string, dto: UpdateTaxTypeDto) {
    const existing = await this.prisma.taxType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tax type not found');
    this.abac.assertAgencyAccess(actor, existing.agencyId);

    const tax = await this.prisma.taxType.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        name: dto.name,
        description: dto.description,
        ratePercent: dto.ratePercent,
        isActive: dto.isActive,
      },
    });

    await this.audit.log({
      agencyId: existing.agencyId,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'TaxType',
      entityId: tax.id,
      before: existing,
      after: tax,
    });
    return { ...tax, ratePercent: Number(tax.ratePercent) };
  }

  async listTaxTypes(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    const taxes = await this.prisma.taxType.findMany({
      where: { agencyId: resolved, isActive: true },
      orderBy: [{ ratePercent: 'desc' }, { name: 'asc' }],
    });
    return taxes.map((t) => ({
      ...t,
      ratePercent: Number(t.ratePercent),
    }));
  }
}
