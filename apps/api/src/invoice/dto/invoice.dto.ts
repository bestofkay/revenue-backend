import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceLineDto {
  @ApiProperty()
  @IsString()
  revenueTypeId!: string;

  @ApiPropertyOptional({ description: 'Tax type applied to this revenue line' })
  @IsOptional()
  @IsString()
  taxTypeId?: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  unitAmountMinor!: number;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty()
  @IsString()
  payerName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerTin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  dueInHours?: number;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines!: InvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Auto-create payment link and virtual account' })
  @IsOptional()
  autoPaymentRequest?: boolean;
}

export class CreateInvoiceFromAssessmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  dueInHours?: number;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  payerEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerTin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ type: [InvoiceLineDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines?: InvoiceLineDto[];
}

export class CancelInvoiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
