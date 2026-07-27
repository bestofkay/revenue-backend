import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { AuditAction } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CryptoService } from '../common/services/crypto.service';
import { AbacService } from '../common/services/abac.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateApiKeyDto, CreateUserDto, UpdateUserDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly crypto: CryptoService,
    private readonly abac: AbacService,
  ) {}

  async create(actor: AuthUser, dto: CreateUserDto) {
    const agencyId = dto.agencyId
      ? this.abac.resolveAgencyId(actor, dto.agencyId)
      : actor.agencyId ?? undefined;
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Email already registered');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: await argon2.hash(dto.password),
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        agencyId,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        roles: dto.roleIds?.length
          ? { create: dto.roleIds.map((roleId) => ({ roleId })) }
          : undefined,
      },
      include: { roles: { include: { role: true } } },
    });

    await this.audit.log({
      agencyId,
      actorId: actor.id,
      action: AuditAction.CREATE,
      entityType: 'User',
      entityId: user.id,
      after: { email: user.email, roles: dto.roleIds },
    });
    return this.sanitize(user);
  }

  async findAll(actor: AuthUser, agencyId?: string) {
    const resolved = actor.isSuperAdmin ? agencyId : this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.user.findMany({
      where: resolved ? { agencyId: resolved } : undefined,
      include: { roles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    }).then((users) => users.map((u) => this.sanitize(u)));
  }

  async update(actor: AuthUser, id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    this.abac.assertAgencyAccess(actor, user.agencyId);

    if (dto.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      await this.prisma.userRole.createMany({
        data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
      });
      await this.audit.log({
        agencyId: user.agencyId,
        actorId: actor.id,
        action: AuditAction.ROLE_CHANGE,
        entityType: 'User',
        entityId: id,
        after: { roleIds: dto.roleIds },
      });
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.active === undefined ? undefined : dto.active ? 'ACTIVE' : 'INACTIVE',
      },
      include: { roles: { include: { role: true } } },
    });
    return this.sanitize(updated);
  }

  async createApiKey(actor: AuthUser, dto: CreateApiKeyDto) {
    const agencyId = this.abac.resolveAgencyId(actor, dto.agencyId);
    const prefix = randomBytes(6).toString('hex');
    const secret = randomBytes(24).toString('base64url');
    const record = await this.prisma.apiKey.create({
      data: {
        agencyId,
        userId: actor.id.startsWith('api:') ? null : actor.id,
        name: dto.name,
        keyPrefix: prefix,
        keyHash: this.crypto.hash(secret),
        scopes: dto.scopes,
      },
    });
    await this.audit.log({
      agencyId,
      actorId: actor.id,
      action: AuditAction.CREATE,
      entityType: 'ApiKey',
      entityId: record.id,
      after: { name: dto.name, scopes: dto.scopes },
    });
    return {
      id: record.id,
      name: record.name,
      apiKey: `${prefix}.${secret}`,
      scopes: record.scopes,
      warning: 'Store this API key securely. It will not be shown again.',
    };
  }

  async listRoles(actor: AuthUser, agencyId?: string) {
    const resolved = actor.isSuperAdmin ? agencyId : this.abac.resolveAgencyId(actor, agencyId);
    return this.prisma.role.findMany({
      where: {
        OR: [{ agencyId: resolved ?? null }, { agencyId: null }],
      },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  private sanitize(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    status: string;
    agencyId: string | null;
    isSuperAdmin: boolean;
    roles?: Array<{ role: { id: string; code: string; name: string } }>;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      status: user.status,
      agencyId: user.agencyId,
      isSuperAdmin: user.isSuperAdmin,
      roles: user.roles?.map((r) => r.role) ?? [],
    };
  }
}
