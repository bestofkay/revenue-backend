import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import {
  CancelInvoiceDto,
  CreateInvoiceDto,
  CreateInvoiceFromAssessmentDto,
  UpdateInvoiceDto,
} from './dto/invoice.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoices: InvoiceService) {}

  @Post()
  @RequirePermissions('invoices:write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateInvoiceDto) {
    return this.invoices.create(user, dto);
  }

  @Post('from-assessment/:assessmentId')
  @RequirePermissions('invoices:write')
  fromAssessment(
    @CurrentUser() user: AuthUser,
    @Param('assessmentId') assessmentId: string,
    @Body() dto: CreateInvoiceFromAssessmentDto,
  ) {
    return this.invoices.createFromAssessment(user, assessmentId, dto);
  }

  @Get()
  @RequirePermissions('invoices:read')
  list(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.invoices.list(user, agencyId);
  }

  @Get(':id')
  @RequirePermissions('invoices:read')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.invoices.getOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('invoices:write')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoices.update(user, id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('invoices:write')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelInvoiceDto,
  ) {
    return this.invoices.cancel(user, id, dto);
  }
}
