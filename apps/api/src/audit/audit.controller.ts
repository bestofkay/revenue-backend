import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { AbacService } from '../common/services/abac.service';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly abac: AbacService,
  ) {}

  @Get()
  @RequirePermissions('audit:read')
  list(
    @CurrentUser() user: AuthUser,
    @Query('agencyId') agencyId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    const resolved = user.isSuperAdmin ? agencyId : this.abac.resolveAgencyId(user, agencyId);
    return this.audit.findMany(resolved, Number(page), Number(limit));
  }
}
