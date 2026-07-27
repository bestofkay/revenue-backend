import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
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
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('revenue')
@ApiBearerAuth()
@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenue: RevenueService) {}

  @Post('categories')
  @RequirePermissions('revenue:write')
  createCategory(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.revenue.createCategory(user, dto);
  }

  @Patch('categories/:id')
  @RequirePermissions('revenue:write')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.revenue.updateCategory(user, id, dto);
  }

  @Get('categories')
  @RequirePermissions('revenue:read')
  listCategories(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.revenue.listCategories(user, agencyId);
  }

  @Post('types')
  @RequirePermissions('revenue:write')
  createType(@CurrentUser() user: AuthUser, @Body() dto: CreateRevenueTypeDto) {
    return this.revenue.createType(user, dto);
  }

  @Patch('types/:id')
  @RequirePermissions('revenue:write')
  updateType(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRevenueTypeDto,
  ) {
    return this.revenue.updateType(user, id, dto);
  }

  @Get('types')
  @RequirePermissions('revenue:read')
  listTypes(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.revenue.listTypes(user, agencyId);
  }

  @Post('fees')
  @RequirePermissions('revenue:write')
  addFee(@CurrentUser() user: AuthUser, @Body() dto: CreateFeeScheduleDto) {
    return this.revenue.addFee(user, dto);
  }

  @Patch('fees/:id')
  @RequirePermissions('revenue:write')
  updateFee(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFeeScheduleDto,
  ) {
    return this.revenue.updateFee(user, id, dto);
  }

  @Get('fees')
  @RequirePermissions('revenue:read')
  listFees(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.revenue.listFees(user, agencyId);
  }

  @Post('taxes')
  @RequirePermissions('revenue:write')
  createTax(@CurrentUser() user: AuthUser, @Body() dto: CreateTaxTypeDto) {
    return this.revenue.createTaxType(user, dto);
  }

  @Patch('taxes/:id')
  @RequirePermissions('revenue:write')
  updateTax(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaxTypeDto,
  ) {
    return this.revenue.updateTaxType(user, id, dto);
  }

  @Get('taxes')
  @RequirePermissions('revenue:read')
  listTaxes(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.revenue.listTaxTypes(user, agencyId);
  }
}
