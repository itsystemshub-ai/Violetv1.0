import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateEmpresaConfigDto {
  @IsString()
  businessName: string;

  @IsString()
  rif: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  fiscalYear?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  invoicePrefix?: string;

  @IsString()
  @IsOptional()
  invoiceControl?: string;

  @IsString()
  @IsOptional()
  invoiceSeries?: string;

  @IsNumber()
  @IsOptional()
  nextInvoiceNum?: number;

  @IsBoolean()
  @IsOptional()
  checkStock?: boolean;

  @IsBoolean()
  @IsOptional()
  allowNegativeStock?: boolean;

  @IsNumber()
  @IsOptional()
  commissionRate?: number;

  @IsString()
  @IsOptional()
  defaultWarehouseId?: string;

  @IsString()
  @IsOptional()
  valuationMethod?: string;
}

export class UpdateEmpresaConfigDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  rif?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  fiscalYear?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  invoicePrefix?: string;

  @IsString()
  @IsOptional()
  invoiceControl?: string;

  @IsString()
  @IsOptional()
  invoiceSeries?: string;

  @IsNumber()
  @IsOptional()
  nextInvoiceNum?: number;

  @IsBoolean()
  @IsOptional()
  checkStock?: boolean;

  @IsBoolean()
  @IsOptional()
  allowNegativeStock?: boolean;

  @IsNumber()
  @IsOptional()
  commissionRate?: number;

  @IsString()
  @IsOptional()
  defaultWarehouseId?: string;

  @IsString()
  @IsOptional()
  valuationMethod?: string;
}
