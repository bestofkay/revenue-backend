import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SettlementService } from './settlement.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

class SettleBatchDto {
  @ApiProperty()
  @IsString()
  tsaReference!: string;
}

@ApiTags('settlements')
@ApiBearerAuth()
@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlements: SettlementService) {}

  @Get()
  @RequirePermissions('settlements:read')
  list(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.settlements.list(user, agencyId);
  }

  @Get('batches')
  @RequirePermissions('settlements:read')
  batches(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.settlements.listBatches(user, agencyId);
  }

  @Post('batches')
  @RequirePermissions('settlements:write')
  createBatch(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.settlements.createBatch(user, agencyId);
  }

  @Post('batches/:id/settle')
  @RequirePermissions('settlements:write')
  settle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SettleBatchDto,
  ) {
    return this.settlements.markBatchSettled(user, id, dto.tsaReference);
  }
}
