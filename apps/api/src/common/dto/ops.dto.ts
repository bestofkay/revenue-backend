import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '@revenue/database';

export class UpsertGatewayConfigDto {
  @ApiProperty({ enum: PaymentProvider })
  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  secretKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  publicKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateRefundDto {
  @ApiProperty()
  @IsString()
  paymentId!: string;

  @ApiProperty({ description: 'Refund amount in minor units (kobo)' })
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsString()
  email!: string;
}
