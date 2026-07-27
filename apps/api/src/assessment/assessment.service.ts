import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalAction, AssessmentStatus, AuditAction } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AbacService } from '../common/services/abac.service';
import { SequenceService } from '../common/services/sequence.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { ApprovalDto, CreateAssessmentDto } from './dto/assessment.dto';
import { computeLineAmounts } from '../common/utils/line-tax';

@Injectable()
export class AssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly abac: AbacService,
    private readonly sequences: SequenceService,
  ) {}

  async create(actor: AuthUser, dto: CreateAssessmentDto) {
    const agencyId = this.abac.resolveAgencyId(actor, dto.agencyId);
    const year = new Date().getUTCFullYear();
    const seq = await this.sequences.next(agencyId, 'ASSESSMENT', year);
    const agency = await this.prisma.agency.findUniqueOrThrow({ where: { id: agencyId } });

    const taxIds = [...new Set(dto.lines.map((l) => l.taxTypeId).filter(Boolean) as string[])];
    const taxes = taxIds.length
      ? await this.prisma.taxType.findMany({
          where: { id: { in: taxIds }, agencyId, isActive: true },
        })
      : [];
    const rateById = new Map(taxes.map((t) => [t.id, Number(t.ratePercent)]));

    let subtotal = 0;
    let taxTotal = 0;
    const lines = dto.lines.map((line) => {
      if (line.taxTypeId && !rateById.has(line.taxTypeId)) {
        throw new BadRequestException(`Unknown or inactive tax type: ${line.taxTypeId}`);
      }
      const rate = line.taxTypeId ? (rateById.get(line.taxTypeId) ?? 0) : 0;
      const amounts = computeLineAmounts(line.quantity, line.unitAmountMinor, rate);
      subtotal += amounts.baseMinor;
      taxTotal += amounts.taxMinor;
      return {
        revenueTypeId: line.revenueTypeId,
        taxTypeId: line.taxTypeId || null,
        description: line.description,
        quantity: line.quantity,
        unitAmountMinor: line.unitAmountMinor,
        taxRatePercent: amounts.taxRatePercent,
        taxMinor: amounts.taxMinor,
        lineTotalMinor: amounts.lineTotalMinor,
      };
    });

    const assessment = await this.prisma.assessment.create({
      data: {
        agencyId,
        branchId: dto.branchId,
        createdById: actor.id,
        assessmentNumber: `ASM-${agency.code}-${year}-${String(seq).padStart(8, '0')}`,
        payerName: dto.payerName,
        payerEmail: dto.payerEmail,
        payerPhone: dto.payerPhone,
        payerTin: dto.payerTin,
        notes: dto.notes,
        subtotalMinor: subtotal,
        taxMinor: taxTotal,
        totalMinor: subtotal + taxTotal,
        status: AssessmentStatus.DRAFT,
        lines: { create: lines },
      },
      include: { lines: { include: { revenueType: true, taxType: true } } },
    });

    await this.audit.log({
      agencyId,
      actorId: actor.id,
      action: AuditAction.ASSESSMENT,
      entityType: 'Assessment',
      entityId: assessment.id,
      after: assessment,
    });
    return assessment;
  }

  async submit(actor: AuthUser, id: string, dto: ApprovalDto) {
    const assessment = await this.getForActor(actor, id);
    if (assessment.status !== AssessmentStatus.DRAFT && assessment.status !== AssessmentStatus.REJECTED) {
      throw new BadRequestException('Assessment cannot be submitted in current status');
    }
    const updated = await this.prisma.assessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.PENDING_APPROVAL,
        currentStep: 1,
        approvals: {
          create: {
            actorId: actor.id,
            action: ApprovalAction.SUBMIT,
            stepOrder: 0,
            comments: dto.comments,
          },
        },
      },
      include: { lines: true, approvals: true },
    });
    await this.audit.log({
      agencyId: assessment.agencyId,
      actorId: actor.id,
      action: AuditAction.ASSESSMENT,
      entityType: 'Assessment',
      entityId: id,
      after: { status: updated.status },
    });
    return updated;
  }

  async approve(actor: AuthUser, id: string, dto: ApprovalDto) {
    const assessment = await this.getForActor(actor, id);
    if (assessment.status !== AssessmentStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Assessment is not pending approval');
    }
    if (!actor.isSuperAdmin && !actor.permissions.includes('assessments:approve')) {
      throw new BadRequestException('Approver permission required');
    }

    const workflow = await this.prisma.approvalWorkflow.findFirst({
      where: { agencyId: assessment.agencyId, entityType: 'ASSESSMENT', isActive: true },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    const maxStep = workflow?.steps.length ?? 1;
    const nextStep = assessment.currentStep + 1;
    const isFinal = !workflow || assessment.currentStep >= maxStep;

    const updated = await this.prisma.assessment.update({
      where: { id },
      data: {
        status: isFinal ? AssessmentStatus.APPROVED : AssessmentStatus.PENDING_APPROVAL,
        currentStep: isFinal ? assessment.currentStep : nextStep,
        approvedAt: isFinal ? new Date() : undefined,
        approvals: {
          create: {
            actorId: actor.id,
            action: ApprovalAction.APPROVE,
            stepOrder: assessment.currentStep,
            comments: dto.comments,
          },
        },
      },
      include: { lines: { include: { revenueType: true } }, approvals: true },
    });

    await this.audit.log({
      agencyId: assessment.agencyId,
      actorId: actor.id,
      action: AuditAction.APPROVE,
      entityType: 'Assessment',
      entityId: id,
      after: { status: updated.status, step: updated.currentStep },
    });
    return updated;
  }

  async reject(actor: AuthUser, id: string, dto: ApprovalDto) {
    const assessment = await this.getForActor(actor, id);
    const updated = await this.prisma.assessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: dto.comments,
        approvals: {
          create: {
            actorId: actor.id,
            action: ApprovalAction.REJECT,
            stepOrder: assessment.currentStep,
            comments: dto.comments,
          },
        },
      },
      include: { lines: true, approvals: true },
    });
    await this.audit.log({
      agencyId: assessment.agencyId,
      actorId: actor.id,
      action: AuditAction.REJECT,
      entityType: 'Assessment',
      entityId: id,
      after: { status: updated.status },
    });
    return updated;
  }

  async list(actor: AuthUser, agencyId?: string) {
    const resolved = this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.assessment.findMany({
      where: { agencyId: resolved },
      include: { lines: true, createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getOne(actor: AuthUser, id: string) {
    return this.getForActor(actor, id);
  }

  private async getForActor(actor: AuthUser, id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        lines: { include: { revenueType: true } },
        approvals: { include: { actor: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    this.abac.assertAgencyAccess(actor, assessment.agencyId);
    return assessment;
  }
}
