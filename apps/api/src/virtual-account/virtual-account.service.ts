import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentProvider, VirtualAccountStatus } from '@revenue/database';
import { PrismaService } from '../prisma/prisma.service';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class VirtualAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateways: GatewayService,
  ) {}

  async allocate(input: {
    agencyId: string;
    paymentRequestId: string;
    provider: PaymentProvider;
    invoiceNumber: string;
    paymentReference: string;
    amountMinor: number;
    currency: string;
    accountName: string;
    payerEmail?: string;
    expiresAt: Date;
  }) {
    const agency = await this.prisma.agency.findUniqueOrThrow({ where: { id: input.agencyId } });
    const adapter = this.gateways.get(input.provider);
    const result = await adapter.createVirtualAccount({
      agencyId: input.agencyId,
      agencyCode: agency.code,
      invoiceNumber: input.invoiceNumber,
      paymentReference: input.paymentReference,
      amountMinor: input.amountMinor,
      currency: input.currency,
      accountName: input.accountName,
      payerEmail: input.payerEmail,
      expiresAt: input.expiresAt,
    });

    return this.prisma.virtualAccount.create({
      data: {
        agencyId: input.agencyId,
        paymentRequestId: input.paymentRequestId,
        provider: result.provider,
        bankCode: result.bankCode,
        bankName: result.bankName,
        accountNumber: result.accountNumber,
        accountName: result.accountName,
        invoiceNumber: input.invoiceNumber,
        currency: input.currency,
        status: VirtualAccountStatus.ACTIVE,
        expiresAt: input.expiresAt,
        providerRef: result.providerRef,
        metadata: result.metadata as object | undefined,
      },
    });
  }

  async assertReceivable(accountNumber: string, bankCode?: string) {
    const va = await this.prisma.virtualAccount.findFirst({
      where: {
        accountNumber,
        ...(bankCode ? { bankCode } : {}),
      },
      include: { paymentRequest: true },
    });
    if (!va) throw new NotFoundException('Virtual account not found');
    if (va.status !== VirtualAccountStatus.ACTIVE) {
      throw new BadRequestException('Virtual account is not active');
    }
    if (va.expiresAt.getTime() < Date.now()) {
      await this.prisma.virtualAccount.update({
        where: { id: va.id },
        data: { status: VirtualAccountStatus.EXPIRED },
      });
      throw new BadRequestException('Virtual account has expired and cannot receive payments');
    }
    return va;
  }

  async expireDue() {
    const result = await this.prisma.virtualAccount.updateMany({
      where: {
        status: VirtualAccountStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: { status: VirtualAccountStatus.EXPIRED },
    });
    return { expired: result.count };
  }
}
