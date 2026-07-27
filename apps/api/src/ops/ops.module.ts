import { Module } from '@nestjs/common';
import { OpsService } from './ops.service';
import { OpsController } from './ops.controller';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [OpsController],
  providers: [OpsService, CryptoService],
  exports: [OpsService],
})
export class OpsModule {}
