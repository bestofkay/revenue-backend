import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PaymentService } from './payment.service';
import { PaymentController, ReceiptController } from './payment.controller';
import { ReceiptService } from './receipt.service';
import { VirtualAccountModule } from '../virtual-account/virtual-account.module';
import { GatewayModule } from '../gateway/gateway.module';
import { SequenceService } from '../common/services/sequence.service';
import { NotificationModule } from '../notification/notification.module';
import { SettlementModule } from '../settlement/settlement.module';

@Module({
  imports: [
    GatewayModule,
    VirtualAccountModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => SettlementModule),
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [PaymentController, ReceiptController],
  providers: [PaymentService, ReceiptService, SequenceService],
  exports: [PaymentService, ReceiptService],
})
export class PaymentModule {}
