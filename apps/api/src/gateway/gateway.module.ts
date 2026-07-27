import { Module } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { PaystackAdapter } from './adapters/paystack.adapter';
import { FlutterwaveAdapter } from './adapters/flutterwave.adapter';
import { RemitaAdapter } from './adapters/remita.adapter';
import { GatewayController } from './gateway.controller';

@Module({
  controllers: [GatewayController],
  providers: [GatewayService, PaystackAdapter, FlutterwaveAdapter, RemitaAdapter],
  exports: [GatewayService, PaystackAdapter, FlutterwaveAdapter, RemitaAdapter],
})
export class GatewayModule {}
