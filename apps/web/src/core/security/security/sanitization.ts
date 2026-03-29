/**
 * Sanitización de inputs para prevenir XSS y SQL Injection
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remover caracteres de control y null bytes
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
};

/**
 * Valida y sanitiza un email
 */
export const sanitizeEmail = (email: string): string | null => {
  const sanitized = sanitizeString(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
};

/**
 * Valida y sanitiza un número de teléfono
 */
export const sanitizePhone = (phone: string): string => {
  // Remover todo excepto números, +, -, (, ), espacios
  return phone.replace(/[^\d+\-() ]/g, '').trim();
};

/**
 * Sanitiza un RIF venezolano
 */
export const sanitizeRIF = (rif: string): string => {
  // Formato: J-12345678-9
  return rif
    .toUpperCase()
    .replace(/[^JGVEPCD0-9-]/g, '')
    .trim();
};

/**
 * Valida que un string no contenga SQL injection patterns
 */
export const isSafeSqlString = (input: string): boolean => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /(UNION.*SELECT)/gi,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitiza un objeto completo recursivamente
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) :
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Valida que un filename sea seguro
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};

/**
 * Valida que una URL sea segura
 */
export const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Solo permitir http y https
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitiza un path para prevenir directory traversal
 */
export const sanitizePath = (path: string): string => {
  return path
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/^\/+/, '')
    .trim();
};

/**
 * Valida que un número esté en un rango
 */
export const validateNumberRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return typeof value === 'number' && 
         !isNaN(value) && 
         value >= min && 
         value <= max;
};

/**
 * Sanitiza un monto monetario
 */
export const sanitizeAmount = (amount: string | number): number => {
  const num = typeof amount === 'string' 
    ? parseFloat(amount.replace(/[^0-9.-]/g, ''))
    : amount;
  
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
};
