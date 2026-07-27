import { Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VirtualAccountService } from './virtual-account.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('virtual-accounts')
@ApiBearerAuth()
@Controller('virtual-accounts')
export class VirtualAccountController {
  constructor(private readonly vas: VirtualAccountService) {}

  @Post('expire-due')
  @RequirePermissions('payments:write')
  expireDue() {
    return this.vas.expireDue();
  }

  @Post(':accountNumber/validate')
  @RequirePermissions('payments:read')
  validate(@Param('accountNumber') accountNumber: string) {
    return this.vas.assertReceivable(accountNumber);
  }
}
