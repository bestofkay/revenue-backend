import { Module, forwardRef } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';
import { SequenceService } from '../common/services/sequence.service';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [forwardRef(() => PaymentModule)],
  controllers: [SettlementController],
  providers: [SettlementService, SequenceService],
  exports: [SettlementService],
})
export class SettlementModule {}
