import { Module, forwardRef } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { SequenceService } from '../common/services/sequence.service';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [forwardRef(() => PaymentModule)],
  controllers: [InvoiceController],
  providers: [InvoiceService, SequenceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
