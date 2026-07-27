import { Injectable } from '@nestjs/common';
import { AuditAction } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    agencyId?: string | null;
    actorId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    before?: unknown;
    after?: unknown;
    metadata?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        agencyId: input.agencyId ?? undefined,
        actorId: input.actorId ?? undefined,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        before: input.before as object | undefined,
        after: input.after as object | undefined,
        metadata: input.metadata as object | undefined,
      },
    });
  }

  async findMany(agencyId: string | undefined, page = 1, limit = 50) {
    const where = agencyId ? { agencyId } : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, limit };
  }
}
