import { IsEmail, IsOptional, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@revenue.gov.ng' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'ChangeMe@12345' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  totpCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class Enable2faDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  totpCode!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'officer.apapa@ncs.gov.ng' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  newPassword!: string;
}

export class OAuthTokenDto {
  @ApiProperty({ example: 'client_credentials' })
  @IsString()
  grant_type!: string;

  @ApiProperty()
  @IsString()
  client_id!: string;

  @ApiProperty()
  @IsString()
  client_secret!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;
}
