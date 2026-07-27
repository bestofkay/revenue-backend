import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentProvider } from '@revenue/database';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { ReceiptService } from './receipt.service';
import {
  CreatePaymentLinkDto,
  GenerateAccountDto,
  SharePaymentLinkDto,
  SimulatePaymentDto,
  VerifyPaymentDto,
} from './dto/payment.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly payments: PaymentService,
    private readonly receipts: ReceiptService,
  ) {}

  @Post('create-link')
  @ApiBearerAuth()
  @RequirePermissions('payments:write')
  createLink(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentLinkDto) {
    return this.payments.createLink(user, dto);
  }

  @Post('generate-account')
  @ApiBearerAuth()
  @RequirePermissions('payments:write')
  generateAccount(@CurrentUser() user: AuthUser, @Body() dto: GenerateAccountDto) {
    return this.payments.generateAccount(user, dto);
  }

  @Get()
  @ApiBearerAuth()
  @RequirePermissions('payments:read')
  list(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.payments.list(user, agencyId);
  }

  @Get('requests')
  @ApiBearerAuth()
  @RequirePermissions('payments:read')
  listRequests(@CurrentUser() user: AuthUser, @Query('agencyId') agencyId?: string) {
    return this.payments.listRequests(user, agencyId);
  }

  @Public()
  @Get(':code')
  getByCode(@Param('code') code: string) {
    return this.payments.getByCode(code);
  }

  @Public()
  @Post(':code/click')
  trackClick(@Param('code') code: string) {
    return this.payments.trackClick(code);
  }

  @Post(':code/share')
  @ApiBearerAuth()
  @RequirePermissions('notifications:write')
  share(@CurrentUser() user: AuthUser, @Param('code') code: string, @Body() dto: SharePaymentLinkDto) {
    return this.payments.share(user, code, dto);
  }

  @Public()
  @Post('verify')
  verify(@Body() dto: VerifyPaymentDto) {
    return this.payments.verify(dto);
  }

  @Public()
  @Post('webhook/:provider')
  webhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: RawBodyRequest<Request>,
    @Body() body: unknown,
  ) {
    const mapped = provider.toUpperCase() as PaymentProvider;
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(body));
    return this.payments.handleWebhook(mapped, headers, raw, body);
  }

  @Public()
  @Post('simulate')
  simulate(@Body() dto: SimulatePaymentDto) {
    return this.payments.simulatePayment(dto);
  }
}

@ApiTags('receipts')
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receipts: ReceiptService) {}

  @Public()
  @Get('public-key')
  publicKey() {
    return this.receipts.getPublicKey();
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.receipts.getById(id);
  }
}
