import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoCuenta {
  SINTETICA = 'SINTETICA',
  MOVIMIENTO = 'MOVIMIENTO',
}

export enum NaturalezaCuenta {
  DEUDORA = 'DEUDORA',
  ACREEDORA = 'ACREEDORA',
}

export class CreatePlanCuentaDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TipoCuenta)
  @IsOptional()
  tipo?: TipoCuenta;

  @IsEnum(NaturalezaCuenta)
  @IsOptional()
  naturaleza?: NaturalezaCuenta;

  @IsString()
  @IsOptional()
  padreId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class MovimientoContableDto {
  @IsString()
  @IsNotEmpty()
  cuentaId: string;

  @IsString()
  @IsNotEmpty()
  tipo: 'DEBE' | 'HABER';

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class CreateAsientoDto {
  @IsString()
  @IsNotEmpty()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsOptional()
  tipo?: string;

  @IsString()
  @IsOptional()
  referencia?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MovimientoContableDto)
  movimientos: MovimientoContableDto[];
}
