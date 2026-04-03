import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionDto {
  @IsString()
  module: string;

  @IsString()
  action: string;

  @IsString()
  @IsOptional()
  resource?: string;
}

export class ModuleAccessDto {
  @IsString()
  moduleGroup: string;

  @IsString()
  moduleName: string;

  @IsBoolean()
  @IsOptional()
  canView?: boolean;

  @IsBoolean()
  @IsOptional()
  canEdit?: boolean;

  @IsBoolean()
  @IsOptional()
  canDelete?: boolean;

  @IsBoolean()
  @IsOptional()
  canExport?: boolean;

  @IsBoolean()
  @IsOptional()
  canReport?: boolean;
}

export class CreateRoleDto {
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  @IsOptional()
  permissions?: PermissionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleAccessDto)
  @IsOptional()
  modules?: ModuleAccessDto[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  @IsOptional()
  permissions?: PermissionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleAccessDto)
  @IsOptional()
  modules?: ModuleAccessDto[];
}
