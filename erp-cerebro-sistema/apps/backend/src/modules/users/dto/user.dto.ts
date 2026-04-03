import { IsEmail, IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  cedula: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  roleId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  roleId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  phone?: string;
}
