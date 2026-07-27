import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportingController {
  constructor(private readonly reports: ReportingService) {}

  @Get('catalog')
  @RequirePermissions('reports:read')
  catalog() {
    return this.reports.catalog();
  }

  @Get('pack')
  @RequirePermissions('reports:read')
  pack(
    @CurrentUser() user: AuthUser,
    @Query('type') type = 'collection',
    @Query('period') period = 'monthly',
    @Query('agencyId') agencyId?: string,
  ) {
    return this.reports.reportPack(user, type, period, agencyId);
  }

  @Get('dashboard')
  @RequirePermissions('reports:read')
  dashboard(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.reports.dashboard(user, agencyId);
  }

  @Get('collection')
  @RequirePermissions('reports:read')
  collection(
    @CurrentUser() user: AuthUser,
    @Query('period') period = 'monthly',
    @Query('agencyId') agencyId?: string,
  ) {
    return this.reports.collectionReport(user, period, agencyId);
  }

  @Get('period')
  @RequirePermissions('reports:read')
  period(
    @CurrentUser() user: AuthUser,
    @Query('period') period = 'monthly',
    @Query('agencyId') agencyId?: string,
  ) {
    return this.reports.periodReport(user, period, agencyId);
  }

  @Get('revenue-types')
  @RequirePermissions('reports:read')
  byType(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.reports.byRevenueType(user, agencyId);
  }

  @Get('officers')
  @RequirePermissions('reports:read')
  byOfficer(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.reports.byOfficer(user, agencyId);
  }

  @Get('branches')
  @RequirePermissions('reports:read')
  byBranch(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.reports.byBranch(user, agencyId);
  }
}
