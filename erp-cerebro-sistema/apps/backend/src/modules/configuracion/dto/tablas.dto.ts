import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateTablasDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}

export class UpdateTablasDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateTablaItemDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;
}
