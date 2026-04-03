import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateSystemConfigDto {
  @IsString()
  key: string;

  @IsString()
  value: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  group?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsBoolean()
  @IsOptional()
  isEditable?: boolean;
}

export class UpdateSystemConfigDto {
  @IsString()
  @IsOptional()
  value?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
