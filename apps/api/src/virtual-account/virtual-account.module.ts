import { Module } from '@nestjs/common';
import { VirtualAccountService } from './virtual-account.service';
import { VirtualAccountController } from './virtual-account.controller';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [GatewayModule],
  controllers: [VirtualAccountController],
  providers: [VirtualAccountService],
  exports: [VirtualAccountService],
})
export class VirtualAccountModule {}
