import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AssessmentService } from './assessment.service';
import { ApprovalDto, CreateAssessmentDto } from './dto/assessment.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly assessments: AssessmentService) {}

  @Post()
  @RequirePermissions('assessments:write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssessmentDto) {
    return this.assessments.create(user, dto);
  }

  @Get()
  @RequirePermissions('assessments:read')
  list(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.assessments.list(user, agencyId);
  }

  @Get(':id')
  @RequirePermissions('assessments:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assessments.getOne(user, id);
  }

  @Post(':id/submit')
  @RequirePermissions('assessments:write')
  submit(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApprovalDto) {
    return this.assessments.submit(user, id, dto);
  }

  @Post(':id/approve')
  @RequirePermissions('assessments:approve')
  approve(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApprovalDto) {
    return this.assessments.approve(user, id, dto);
  }

  @Post(':id/reject')
  @RequirePermissions('assessments:approve')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ApprovalDto) {
    return this.assessments.reject(user, id, dto);
  }
}
