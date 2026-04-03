import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  TRANSFERENCIA = 'TRANSFERENCIA',
  AJUSTE = 'AJUSTE',
}

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  unidadMedida?: string;

  @IsNumber()
  @IsOptional()
  costoActual?: number;

  @IsNumber()
  @IsOptional()
  precioVenta?: number;

  @IsNumber()
  @IsOptional()
  existenciaMinima?: number;

  @IsNumber()
  @IsOptional()
  existenciaMaxima?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateAlmacenDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  responsable?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateMovimientoDto {
  @IsString()
  @IsNotEmpty()
  productoId: string;

  @IsString()
  @IsNotEmpty()
  almacenId: string;

  @IsEnum(TipoMovimiento)
  @IsNotEmpty()
  tipo: TipoMovimiento;

  @IsNumber()
  @IsNotEmpty()
  cantidad: number;

  @IsString()
  @IsOptional()
  referencia?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
