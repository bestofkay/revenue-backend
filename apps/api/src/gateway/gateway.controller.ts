import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GatewayService } from './gateway.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('gateways')
@ApiBearerAuth()
@Controller('gateways')
export class GatewayController {
  constructor(private readonly gateways: GatewayService) {}

  @Get()
  @RequirePermissions('gateways:write')
  list() {
    return { providers: this.gateways.list() };
  }
}
