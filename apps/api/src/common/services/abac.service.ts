import { BadRequestException, ForbiddenException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../decorators/current-user.decorator';

/**
 * Single-tenant ABAC. Super admins fall back to TENANT_AGENCY_CODE when agencyId omitted.
 */
@Injectable()
export class AbacService implements OnModuleInit {
  private cachedTenantId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.getTenantAgencyId();
    } catch {
      // Seed may not have run yet; first request will retry.
    }
  }

  async getTenantAgencyId(): Promise<string> {
    if (this.cachedTenantId) return this.cachedTenantId;
    const code = this.config.get<string>('TENANT_AGENCY_CODE', 'NCS');
    const agency = await this.prisma.agency.findUnique({ where: { code } });
    if (!agency) {
      throw new BadRequestException(`Tenant agency ${code} is not provisioned. Run db:seed.`);
    }
    this.cachedTenantId = agency.id;
    return agency.id;
  }

  assertAgencyAccess(user: AuthUser, agencyId: string | null | undefined) {
    if (user.isSuperAdmin) return;
    if (!agencyId) throw new BadRequestException('agencyId is required');
    if (user.agencyId !== agencyId) {
      throw new ForbiddenException('Cross-agency access denied');
    }
  }

  resolveAgencyId(user: AuthUser, requestedAgencyId?: string): string {
    if (user.isSuperAdmin) {
      if (requestedAgencyId) return requestedAgencyId;
      if (user.agencyId) return user.agencyId;
      if (this.cachedTenantId) return this.cachedTenantId;
      // Cache can be cold when the API booted before db:seed. Sync callers cannot
      // await Prisma, so use the stable single-tenant id and refresh the cache.
      void this.getTenantAgencyId().catch(() => undefined);
      const configuredId = this.config.get<string>('TENANT_AGENCY_ID');
      if (configuredId) {
        this.cachedTenantId = configuredId;
        return configuredId;
      }
      const code = this.config.get<string>('TENANT_AGENCY_CODE', 'NCS');
      if (code === 'NCS') {
        this.cachedTenantId = 'ncs-agency';
        return this.cachedTenantId;
      }
      throw new BadRequestException('Tenant agency not ready. Ensure db:seed has run.');
    }
    if (!user.agencyId) throw new ForbiddenException('User is not assigned to an agency');
    if (requestedAgencyId && requestedAgencyId !== user.agencyId) {
      throw new ForbiddenException('Cross-agency access denied');
    }
    return user.agencyId;
  }

  async resolveAgencyIdAsync(user: AuthUser, requestedAgencyId?: string): Promise<string> {
    if (user.isSuperAdmin) {
      if (requestedAgencyId) return requestedAgencyId;
      if (user.agencyId) return user.agencyId;
      return this.getTenantAgencyId();
    }
    return this.resolveAgencyId(user, requestedAgencyId);
  }
}
