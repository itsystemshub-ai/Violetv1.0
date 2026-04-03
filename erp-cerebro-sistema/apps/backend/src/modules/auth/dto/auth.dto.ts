import { IsEmail, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(6)
  mfaToken?: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class MfaVerifyDto {
  @IsString()
  @MaxLength(6)
  token: string;
}

export class MfaSetupDto {
  @IsString()
  @IsOptional()
  issuer?: string;
}
