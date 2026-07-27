import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProvider } from '@revenue/database';
import { PaystackAdapter } from './adapters/paystack.adapter';
import { FlutterwaveAdapter } from './adapters/flutterwave.adapter';
import { RemitaAdapter } from './adapters/remita.adapter';
import { PaymentGatewayAdapter } from './gateway.types';

@Injectable()
export class GatewayService {
  private readonly adapters: Map<PaymentProvider, PaymentGatewayAdapter>;

  constructor(
    paystack: PaystackAdapter,
    flutterwave: FlutterwaveAdapter,
    remita: RemitaAdapter,
  ) {
    this.adapters = new Map<PaymentProvider, PaymentGatewayAdapter>([
      [PaymentProvider.PAYSTACK, paystack],
      [PaymentProvider.FLUTTERWAVE, flutterwave],
      [PaymentProvider.REMITA, remita],
    ]);
  }

  get(provider: PaymentProvider): PaymentGatewayAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) throw new NotFoundException(`Gateway provider ${provider} not configured`);
    return adapter;
  }

  list() {
    return [...this.adapters.keys()];
  }
}
