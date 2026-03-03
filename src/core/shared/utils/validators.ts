/**
 * Módulo de validadores centralizados para Violet ERP.
 * 
 * Proporciona funciones de validación reutilizables para:
 * - Documentos venezolanos (RIF, Cédula)
 * - Datos de contacto (Email, Teléfono)
 * - Datos financieros (Montos, Porcentajes, Cuentas bancarias)
 * - Fechas y rangos
 * - Contraseñas y seguridad
 * - Códigos y formatos especiales
 * 
 * @module validators
 * @category Utilities
 * 
 * @example
 * ```typescript
 * import { validateRIF, validateEmail, validateStrongPassword } from '@/lib/validators';
 * 
 * // Validar RIF
 * if (validateRIF('J-12345678-9')) {
 *   console.log('RIF válido');
 * }
 * 
 * // Validar email
 * if (validateEmail('usuario@empresa.com')) {
 *   console.log('Email válido');
 * }
 * 
 * // Validar contraseña
 * const result = validateStrongPassword('MiPassword123!');
 * if (!result.isValid) {
 *   console.log('Errores:', result.errors);
 * }
 * ```
 */

/**
 * Valida un RIF venezolano según formato oficial.
 * 
 * Formato aceptado: X-NNNNNNNN-N donde:
 * - X: Tipo de persona (J=Jurídica, G=Gubernamental, V=Natural, E=Extranjero, P=Pasaporte, C=Consorcio, D=Diplomático)
 * - NNNNNNNN: 8 dígitos
 * - N: Dígito verificador
 * 
 * @param {string} rif - RIF a validar
 * @returns {boolean} true si el RIF es válido
 * 
 * @example
 * ```typescript
 * validateRIF('J-12345678-9'); // true
 * validateRIF('V-12345678-0'); // true
 * validateRIF('12345678'); // false (falta formato)
 * validateRIF('J-123-4'); // false (formato incorrecto)
 * ```
 */
export const validateRIF = (rif: string): boolean => {
  const rifRegex = /^[JGVEPCD]-\d{8}-\d$/;
  return rifRegex.test(rif);
};

/**
 * Valida una cédula de identidad venezolana según formato oficial.
 * 
 * Formato aceptado: X-NNNNNNN o X-NNNNNNNN donde:
 * - X: Nacionalidad (V=Venezolano, E=Extranjero)
 * - NNNNNNN o NNNNNNNN: 7 u 8 dígitos
 * 
 * @param {string} cedula - Cédula a validar
 * @returns {boolean} true si la cédula es válida
 * 
 * @example
 * ```typescript
 * validateCedula('V-12345678'); // true
 * validateCedula('E-1234567'); // true
 * validateCedula('12345678'); // false (falta formato)
 * validateCedula('V-123'); // false (muy corta)
 * ```
 */
export const validateCedula = (cedula: string): boolean => {
  const cedulaRegex = /^[VE]-\d{7,8}$/;
  return cedulaRegex.test(cedula);
};

/**
 * Valida una dirección de correo electrónico.
 * 
 * Verifica formato básico: usuario@dominio.extension
 * 
 * @param {string} email - Email a validar
 * @returns {boolean} true si el email es válido
 * 
 * @example
 * ```typescript
 * validateEmail('usuario@empresa.com'); // true
 * validateEmail('admin@violet-erp.com.ve'); // true
 * validateEmail('invalido@'); // false
 * validateEmail('@dominio.com'); // false
 * ```
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida un número telefónico venezolano.
 * 
 * Formatos aceptados:
 * - 0414-1234567 (móvil con guión)
 * - +58 414 1234567 (internacional con espacios)
 * - 0212-1234567 (fijo con guión)
 * - 04141234567 (móvil sin guión)
 * 
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} true si el teléfono es válido
 * 
 * @example
 * ```typescript
 * validatePhone('0414-1234567'); // true
 * validatePhone('+58 414 1234567'); // true
 * validatePhone('0212-1234567'); // true
 * validatePhone('123'); // false (muy corto)
 * ```
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+58|0)?[\d\-\s()]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Valida una URL
 */
export const validateURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    // Validate protocol
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Valida un UUID
 */
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Valida un número de cuenta bancaria venezolana
 * 20 dígitos
 */
export const validateBankAccount = (account: string): boolean => {
  const accountRegex = /^\d{20}$/;
  return accountRegex.test(account.replace(/\s/g, ''));
};

/**
 * Valida una contraseña fuerte según estándares de seguridad.
 * 
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * 
 * @param {string} password - Contraseña a validar
 * @returns {Object} Objeto con resultado y errores
 * @returns {boolean} isValid - true si la contraseña es válida
 * @returns {string[]} errors - Array de mensajes de error
 * 
 * @example
 * ```typescript
 * const result = validateStrongPassword('MiPassword123!');
 * if (result.isValid) {
 *   console.log('Contraseña válida');
 * } else {
 *   console.log('Errores:', result.errors);
 *   // ['La contraseña debe contener al menos una mayúscula']
 * }
 * 
 * validateStrongPassword('abc'); 
 * // { isValid: false, errors: ['La contraseña debe tener al menos 8 caracteres', ...] }
 * ```
 */
export const validateStrongPassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida un monto monetario
 */
export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && 
         !isNaN(amount) && 
         isFinite(amount) && 
         amount >= 0;
};

/**
 * Valida un porcentaje (0-100)
 */
export const validatePercentage = (percentage: number): boolean => {
  return typeof percentage === 'number' && 
         !isNaN(percentage) && 
         percentage >= 0 && 
         percentage <= 100;
};

/**
 * Valida una fecha
 */
export const validateDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

/**
 * Valida que una fecha sea futura
 */
export const validateFutureDate = (date: string | Date): boolean => {
  if (!validateDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Valida que una fecha sea pasada
 */
export const validatePastDate = (date: string | Date): boolean => {
  if (!validateDate(date)) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Valida un rango de fechas
 */
export const validateDateRange = (startDate: string | Date, endDate: string | Date): boolean => {
  if (!validateDate(startDate) || !validateDate(endDate)) return false;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  return start < end;
};

/**
 * Valida edad mínima
 */
export const validateMinAge = (birthDate: string | Date, minAge: number): boolean => {
  if (!validateDate(birthDate)) return false;
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const age = (new Date().getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return age >= minAge;
};

/**
 * Valida un código postal venezolano
 */
export const validatePostalCode = (postalCode: string): boolean => {
  const postalCodeRegex = /^\d{4}$/;
  return postalCodeRegex.test(postalCode);
};

/**
 * Valida un nombre de usuario
 * Solo letras, números, guiones y guiones bajos, 3-50 caracteres
 */
export const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
};

/**
 * Valida un SKU de producto
 */
export const validateSKU = (sku: string): boolean => {
  const skuRegex = /^[A-Z0-9-]{3,50}$/;
  return skuRegex.test(sku);
};

/**
 * Valida un número de factura
 * Formato: FACT-2026-00001
 */
export const validateInvoiceNumber = (invoiceNumber: string): boolean => {
  const invoiceRegex = /^[A-Z]{4}-\d{4}-\d{5,}$/;
  return invoiceRegex.test(invoiceNumber);
};

/**
 * Valida coordenadas geográficas
 */
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return typeof lat === 'number' && 
         typeof lng === 'number' &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
};

/**
 * Valida un color hexadecimal
 */
export const validateHexColor = (color: string): boolean => {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexColorRegex.test(color);
};

/**
 * Valida un número de tarjeta de crédito (Luhn algorithm)
 */
export const validateCreditCard = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleaned)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Valida un CVV de tarjeta
 */
export const validateCVV = (cvv: string): boolean => {
  const cvvRegex = /^\d{3,4}$/;
  return cvvRegex.test(cvv);
};

/**
 * Valida un IBAN (International Bank Account Number)
 */
export const validateIBAN = (iban: string): boolean => {
  const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/;
  return ibanRegex.test(iban.replace(/\s/g, ''));
};

/**
 * Valida un número de lote
 */
export const validateBatchNumber = (batch: string): boolean => {
  const batchRegex = /^[A-Z0-9-]{3,20}$/;
  return batchRegex.test(batch);
};

/**
 * Valida un código de barras (EAN-13)
 */
export const validateBarcode = (barcode: string): boolean => {
  const barcodeRegex = /^\d{13}$/;
  return barcodeRegex.test(barcode);
};
