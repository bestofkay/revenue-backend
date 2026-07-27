import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AbacService } from '../common/services/abac.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateAgencyDto, CreateBranchDto, UpdateAgencyDto } from './dto/agencies.dto';

@Injectable()
export class AgenciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly abac: AbacService,
  ) {}

  async create(actor: AuthUser, dto: CreateAgencyDto) {
    if (!actor.isSuperAdmin) throw new ForbiddenException('Only super admin can create agencies');
    const existing = await this.prisma.agency.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException('Agency code exists');

    const agency = await this.prisma.agency.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        shortName: dto.shortName,
        email: dto.email,
        phone: dto.phone,
        state: dto.state,
        paymentCodeStyle: dto.paymentCodeStyle ?? 'AGENCY_DATE_SEQ',
        branches: { create: [{ code: 'HQ', name: 'Headquarters', state: dto.state }] },
      },
      include: { branches: true },
    });

    await this.audit.log({
      agencyId: agency.id,
      actorId: actor.id,
      action: AuditAction.CREATE,
      entityType: 'Agency',
      entityId: agency.id,
      after: agency,
    });
    return agency;
  }

  async findAll(actor: AuthUser) {
    if (actor.isSuperAdmin) {
      return this.prisma.agency.findMany({ include: { branches: true }, orderBy: { name: 'asc' } });
    }
    const agencyId = this.abac.resolveAgencyId(actor);
    return this.prisma.agency.findMany({
      where: { id: agencyId },
      include: { branches: true },
    });
  }

  async findOne(actor: AuthUser, id: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { id },
      include: { branches: true, tsaMappings: true, gatewayConfigs: true },
    });
    if (!agency) throw new NotFoundException('Agency not found');
    this.abac.assertAgencyAccess(actor, agency.id);
    return agency;
  }

  async update(actor: AuthUser, id: string, dto: UpdateAgencyDto) {
    this.abac.assertAgencyAccess(actor, id);
    const agency = await this.prisma.agency.update({
      where: { id },
      data: dto,
    });
    await this.audit.log({
      agencyId: id,
      actorId: actor.id,
      action: AuditAction.CONFIG,
      entityType: 'Agency',
      entityId: id,
      after: dto,
    });
    return agency;
  }

  async addBranch(actor: AuthUser, agencyId: string, dto: CreateBranchDto) {
    this.abac.assertAgencyAccess(actor, agencyId);
    return this.prisma.branch.create({
      data: {
        agencyId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        address: dto.address,
        state: dto.state,
      },
    });
  }
}
