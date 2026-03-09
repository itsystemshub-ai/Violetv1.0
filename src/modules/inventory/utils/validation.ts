/**
 * Utilidades de validación para inventario
 * Incluye: validación de productos, códigos, precios, stock, etc.
 */

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export interface ProductValidationRules {
  requiredFields: string[];
  numericFields: string[];
  minValues: Record<string, number>;
  maxValues: Record<string, number>;
  patternValidations: Record<string, RegExp>;
  customValidators: Array<(product: any) => ValidationError | null>;
}

// Reglas de validación por defecto
export const DEFAULT_VALIDATION_RULES: ProductValidationRules = {
  requiredFields: ['cauplas', 'descripcionManguera', 'precioFCA', 'stock'],
  numericFields: ['precioFCA', 'stock', 'precioVenta', 'costo'],
  minValues: {
    precioFCA: 0,
    stock: 0,
    precioVenta: 0,
    costo: 0
  },
  maxValues: {
    precioFCA: 1000000,
    stock: 100000,
    precioVenta: 1000000,
    costo: 1000000
  },
  patternValidations: {
    cauplas: /^[A-Z0-9\-]+$/i,
    torflex: /^[A-Z0-9\-]+$/i,
    indomax: /^[A-Z0-9\-]+$/i,
    oem: /^[A-Z0-9\-]+$/i
  },
  customValidators: []
};

export class InventoryValidator {
  private rules: ProductValidationRules;

  constructor(rules: ProductValidationRules = DEFAULT_VALIDATION_RULES) {
    this.rules = rules;
  }

  validateProduct(product: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const infos: ValidationError[] = [];

    // Validar campos requeridos
    for (const field of this.rules.requiredFields) {
      if (!this.hasValue(product[field])) {
        errors.push({
          field,
          message: `El campo ${field} es requerido`,
          severity: 'error',
          code: 'REQUIRED_FIELD'
        });
      }
    }

    // Validar campos numéricos
    for (const field of this.rules.numericFields) {
      const value = product[field];
      if (this.hasValue(value)) {
        const numValue = Number(value);
        
        if (isNaN(numValue)) {
          errors.push({
            field,
            message: `El campo ${field} debe ser un número válido`,
            severity: 'error',
            code: 'INVALID_NUMBER'
          });
        } else {
          // Validar valores mínimos
          if (field in this.rules.minValues && numValue < this.rules.minValues[field]) {
            errors.push({
              field,
              message: `El campo ${field} no puede ser menor que ${this.rules.minValues[field]}`,
              severity: 'error',
              code: 'MIN_VALUE'
            });
          }

          // Validar valores máximos
          if (field in this.rules.maxValues && numValue > this.rules.maxValues[field]) {
            warnings.push({
              field,
              message: `El campo ${field} es muy alto (máximo: ${this.rules.maxValues[field]})`,
              severity: 'warning',
              code: 'MAX_VALUE'
            });
          }
        }
      }
    }

    // Validar patrones
    for (const [field, pattern] of Object.entries(this.rules.patternValidations)) {
      const value = product[field];
      if (this.hasValue(value) && !pattern.test(String(value))) {
        warnings.push({
          field,
          message: `El formato de ${field} no es válido`,
          severity: 'warning',
          code: 'INVALID_FORMAT'
        });
      }
    }

    // Validaciones personalizadas
    for (const validator of this.rules.customValidators) {
      const error = validator(product);
      if (error) {
        if (error.severity === 'error') errors.push(error);
        else if (error.severity === 'warning') warnings.push(error);
        else infos.push(error);
      }
    }

    // Validaciones específicas de negocio
    this.validateBusinessRules(product, errors, warnings, infos);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos
    };
  }

  validateProductsBatch(products: any[]): {
    results: ValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      errorCount: number;
      warningCount: number;
      infoCount: number;
    };
  } {
    const results = products.map(product => this.validateProduct(product));
    
    const errorCount = results.reduce((sum, result) => sum + result.errors.length, 0);
    const warningCount = results.reduce((sum, result) => sum + result.warnings.length, 0);
    const infoCount = results.reduce((sum, result) => sum + result.infos.length, 0);
    const validCount = results.filter(result => result.isValid).length;
    const invalidCount = results.length - validCount;

    return {
      results,
      summary: {
        total: products.length,
        valid: validCount,
        invalid: invalidCount,
        errorCount,
        warningCount,
        infoCount
      }
    };
  }

  validateImportFile(file: File): Promise<ValidationResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No se pudo leer el archivo'));
            return;
          }

          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          if (!Array.isArray(jsonData) || jsonData.length === 0) {
            resolve({
              isValid: false,
              errors: [{
                field: 'file',
                message: 'El archivo no contiene datos válidos',
                severity: 'error',
                code: 'EMPTY_FILE'
              }],
              warnings: [],
              infos: []
            });
            return;
          }

          // Validar estructura del archivo
          const firstRow = jsonData[0];
          const missingColumns = this.rules.requiredFields.filter(
            field => !(field in firstRow)
          );

          if (missingColumns.length > 0) {
            resolve({
              isValid: false,
              errors: missingColumns.map(field => ({
                field: 'file',
                message: `Falta la columna: ${field}`,
                severity: 'error',
                code: 'MISSING_COLUMN'
              })),
              warnings: [],
              infos: []
            });
            return;
          }

          // Validar todos los productos
          const batchResult = this.validateProductsBatch(jsonData);
          
          resolve({
            isValid: batchResult.summary.errorCount === 0,
            errors: batchResult.results.flatMap(r => r.errors),
            warnings: batchResult.results.flatMap(r => r.warnings),
            infos: batchResult.results.flatMap(r => r.infos)
          });

        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsBinaryString(file);
    });
  }

  private hasValue(value: any): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  private validateBusinessRules(
    product: any,
    errors: ValidationError[],
    warnings: ValidationError[],
    infos: ValidationError[]
  ): void {
    // Regla 1: Precio de venta debe ser mayor o igual al precio FCA
    if (product.precioVenta && product.precioFCA && product.precioVenta < product.precioFCA) {
      warnings.push({
        field: 'precioVenta',
        message: 'El precio de venta es menor que el precio FCA',
        severity: 'warning',
        code: 'PRICE_MISMATCH'
      });
    }

    // Regla 2: Stock bajo (menos de 10 unidades)
    if (product.stock !== undefined && product.stock < 10) {
      warnings.push({
        field: 'stock',
        message: 'Stock bajo (menos de 10 unidades)',
        severity: 'warning',
        code: 'LOW_STOCK'
      });
    }

    // Regla 3: Stock crítico (menos de 5 unidades)
    if (product.stock !== undefined && product.stock < 5) {
      errors.push({
        field: 'stock',
        message: 'Stock crítico (menos de 5 unidades)',
        severity: 'error',
        code: 'CRITICAL_STOCK'
      });
    }

    // Regla 4: Validar códigos duplicados (solo advertencia)
    if (product.cauplas && product.cauplas.length < 3) {
      warnings.push({
        field: 'cauplas',
        message: 'El código CAUPLAS es muy corto',
        severity: 'warning',
        code: 'SHORT_CODE'
      });
    }

    // Regla 5: Validar descripción
    if (product.descripcionManguera && product.descripcionManguera.length > 200) {
      warnings.push({
        field: 'descripcionManguera',
        message: 'La descripción es muy larga (máximo 200 caracteres)',
        severity: 'warning',
        code: 'LONG_DESCRIPTION'
      });
    }
  }

  // Métodos de utilidad
  static createCustomValidator(
    field: string,
    validateFn: (value: any) => boolean,
    message: string,
    severity: ValidationError['severity'] = 'error',
    code?: string
  ): (product: any) => ValidationError | null {
    return (product) => {
      const value = product[field];
      if (value !== undefined && value !== null && !validateFn(value)) {
        return { field, message, severity, code };
      }
      return null;
    };
  }

  static createRangeValidator(
    field: string,
    min: number,
    max: number,
    message?: string
  ): (product: any) => ValidationError | null {
    return this.createCustomValidator(
      field,
      (value) => {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
      },
      message || `El valor debe estar entre ${min} y ${max}`,
      'error',
      'OUT_OF_RANGE'
    );
  }

  static createPatternValidator(
    field: string,
    pattern: RegExp,
    message?: string
  ): (product: any) => ValidationError | null {
    return this.createCustomValidator(
      field,
      (value) => pattern.test(String(value)),
      message || `El formato no es válido`,
      'warning',
      'INVALID_PATTERN'
    );
  }
}

// Instancia por defecto
export const defaultValidator = new InventoryValidator();

// Funciones helper
export function validateProduct(product: any): ValidationResult {
  return defaultValidator.validateProduct(product);
}

export function validateProductsBatch(products: any[]): ReturnType<InventoryValidator['validateProductsBatch']> {
  return defaultValidator.validateProductsBatch(products);
}

export function validateImportFile(file: File): Promise<ValidationResult> {
  return defaultValidator.validateImportFile(file);
}

// Hook React para validación
import { useState, useCallback } from 'react';

export function useInventoryValidation(rules?: ProductValidationRules) {
  const [validator] = useState(() => new InventoryValidator(rules));
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);

  const validate = useCallback((product: any) => {
    const result = validator.validateProduct(product);
    setValidationHistory(prev => [...prev.slice(-9), result]); // Mantener últimos 10
    return result;
  }, [validator]);

  const validateBatch = useCallback((products: any[]) => {
    const result = validator.validateProductsBatch(products);
    setValidationHistory(prev => [...prev.slice(-9), ...result.results]);
    return result;
  }, [validator]);

  const clearHistory = useCallback(() => {
    setValidationHistory([]);
  }, []);

  return {
    validate,
    validateBatch,
    validationHistory,
    clearHistory,
    validator
  };
}