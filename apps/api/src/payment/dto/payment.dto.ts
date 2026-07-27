import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsArray,
  IsEmail,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentProvider } from '@revenue/database';

export class CreatePaymentLinkDto {
  @ApiProperty()
  @IsString()
  invoiceId!: string;

  @ApiPropertyOptional({ enum: PaymentProvider })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @ApiPropertyOptional({ enum: PaymentMethod, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  methods?: PaymentMethod[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlHours?: number;
}

export class GenerateAccountDto {
  @ApiProperty()
  @IsString()
  paymentRequestId!: string;

  @ApiPropertyOptional({ enum: PaymentProvider })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}

export class VerifyPaymentDto {
  @ApiProperty()
  @IsString()
  reference!: string;

  @ApiPropertyOptional({ enum: PaymentProvider })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}

export class SharePaymentLinkDto {
  @ApiProperty({ enum: ['SMS', 'EMAIL', 'WHATSAPP', 'TELEGRAM'] })
  @IsString()
  channel!: 'SMS' | 'EMAIL' | 'WHATSAPP' | 'TELEGRAM';

  @ApiProperty()
  @IsString()
  recipient!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class SimulatePaymentDto {
  @ApiProperty()
  @IsString()
  paymentCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  amountMinor?: number;
}
