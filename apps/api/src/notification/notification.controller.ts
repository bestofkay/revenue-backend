import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationService } from './notification.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AbacService } from '../common/services/abac.service';

class SendNotificationDto {
  @ApiProperty()
  @IsString()
  channel!: string;

  @ApiProperty()
  @IsString()
  recipient!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agencyId?: string;
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly abac: AbacService,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  @Get()
  @RequirePermissions('notifications:write')
  list(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    const resolved = user.isSuperAdmin ? agencyId : this.abac.resolveAgencyId(user, agencyId);
    return this.notifications.list(resolved);
  }

  @Post('send')
  @RequirePermissions('notifications:write')
  async send(@CurrentUser() user: AuthUser, @Body() dto: SendNotificationDto) {
    const agencyId = dto.agencyId
      ? this.abac.resolveAgencyId(user, dto.agencyId)
      : user.agencyId ?? undefined;
    await this.queue.add('send', { ...dto, agencyId, userId: user.id });
    return { queued: true };
  }
}
