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

export class AssessmentLineDto {
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

  @ApiProperty({ description: 'Unit amount in minor units' })
  @IsInt()
  @Min(1)
  unitAmountMinor!: number;
}

export class CreateAssessmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agencyId?: string;

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
  @IsString()
  notes?: string;

  @ApiProperty({ type: [AssessmentLineDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssessmentLineDto)
  lines!: AssessmentLineDto[];
}

export class ApprovalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
