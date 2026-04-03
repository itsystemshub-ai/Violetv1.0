/**
 * Violet ERP - Utilidades Avanzadas
 * Funciones helper para todo el sistema
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Generar ID único tipo UUID
 */
export function generateId() {
  return `${Date.now()}-${randomBytes(8).toString('hex')}`;
}

/**
 * Generar código único con formato
 */
export function generateCode(prefix = '', length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return prefix ? `${prefix}-${code}` : code;
}

/**
 * Hashear contraseña con SHA-256 + salt
 */
export function hashPassword(password, salt = null) {
  if (!salt) {
    salt = randomBytes(16).toString('hex');
  }

  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');

  return {
    hash,
    salt,
  };
}

/**
 * Verificar contraseña
 */
export function verifyPassword(password, hash, salt) {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

/**
 * Formatear número como moneda
 */
export function formatCurrency(amount, currency = 'DOP', locale = 'es-DO') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatear número
 */
export function formatNumber(number, locale = 'es-DO', options = {}) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options.minimumFractionDigits || 0,
    maximumFractionDigits: options.maximumFractionDigits || 2,
  }).format(number);
}

/**
 * Formatear porcentaje
 */
export function formatPercent(value, locale = 'es-DO') {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * Formatear fecha
 */
export function formatDate(date, format = 'YYYY-MM-DD', locale = 'es-DO') {
  if (!date) return '';

  const d = new Date(date);

  if (format === 'YYYY-MM-DD') {
    return d.toISOString().split('T')[0];
  }

  if (format === 'DD/MM/YYYY') {
    return d.toLocaleDateString(locale);
  }

  if (format === 'MM/DD/YYYY') {
    return d.toLocaleDateString('en-US');
  }

  if (format === 'HH:mm:ss') {
    return d.toLocaleTimeString(locale);
  }

  if (format === 'YYYY-MM-DD HH:mm:ss') {
    return d.toLocaleString(locale);
  }

  return d.toLocaleString(locale);
}

/**
 * Obtener diferencia en días entre fechas
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verificar si una fecha está vencida
 */
export function isExpired(date, includeToday = false) {
  const targetDate = new Date(date);
  const today = new Date();

  if (includeToday) {
    return targetDate < today;
  }

  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  return targetDate < today;
}

/**
 * Calcular edad desde fecha de nacimiento
 */
export function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Sanitizar string para SQL
 */
export function sanitizeString(str) {
  if (!str) return '';

  return str
    .replace(/['";\\]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Normalizar string (quitar acentos)
 */
export function normalizeString(str) {
  if (!str) return '';

  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Buscar string normalizado
 */
export function normalizeForSearch(str) {
  return `%${normalizeString(str)}%`;
}

/**
 * Validar email
 */
export function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Validar RNC/Cédula
 */
export function isValidRNC(rnc) {
  if (!rnc) return false;

  // Limpiar
  const clean = rnc.replace(/[^0-9]/g, '');

  // Verificar longitud (11 para Cédula, 9 para RNC)
  if (clean.length !== 11 && clean.length !== 9) return false;

  // Algoritmo de Luhn
  let sum = 0;
  let isEven = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean[i]);

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
}

/**
 * Parsear número de string (soporta múltiples formatos)
 */
export function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  // Remover símbolos de moneda y espacios
  let clean = value.toString().replace(/[^0-9.,-]/g, '');

  // Detectar formato y convertir
  if (clean.includes(',') && clean.includes('.')) {
    // Formato europeo: 1.234,56 o americano: 1,234.56
    const lastComma = clean.lastIndexOf(',');
    const lastDot = clean.lastIndexOf('.');

    if (lastComma > lastDot) {
      // Europeo
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Americano
      clean = clean.replace(/,/g, '');
    }
  } else if (clean.includes(',')) {
    // Solo comas - podría ser decimal o miles
    const commaCount = (clean.match(/,/g) || []).length;

    if (commaCount === 1 && clean.indexOf(',') > clean.length - 3) {
      // Decimal europeo
      clean = clean.replace(',', '.');
    } else {
      // Miles
      clean = clean.replace(/,/g, '');
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Deep clone de objeto
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
}

/**
 * Merge profundo de objetos
 */
export function deepMerge(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

/**
 * Verificar si es objeto
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Obtener valor anidado de objeto
 */
export function getNestedValue(obj, path, defaultValue = null) {
  if (!obj || !path) return defaultValue;

  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Establecer valor anidado en objeto
 */
export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return obj;
}

/**
 * Omitir keys de objeto
 */
export function omit(obj, keys) {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * Pick keys de objeto
 */
export function pick(obj, keys) {
  const result = {};
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Agrupar array por key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
}

/**
 * Ordenar array de objetos
 */
export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === bVal) return 0;

    const comparison = aVal > bVal ? 1 : -1;
    return order === 'desc' ? -comparison : comparison;
  });
}

/**
 * Eliminar duplicados de array
 */
export function unique(array, key = null) {
  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Chunk array en partes
 */
export function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Calcular suma de array
 */
export function sum(array, key = null) {
  if (!key) {
    return array.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
  }

  return array.reduce((acc, item) => acc + (item[key] || 0), 0);
}

/**
 * Calcular promedio
 */
export function average(array, key = null) {
  const total = sum(array, key);
  const count = key ? array.length : array.filter(n => typeof n === 'number').length;
  return count > 0 ? total / count : 0;
}

/**
 * Calcular mínimo
 */
export function min(array, key = null) {
  if (!key) {
    return Math.min(...array.filter(n => typeof n === 'number'));
  }

  return Math.min(...array.map(item => item[key]));
}

/**
 * Calcular máximo
 */
export function max(array, key = null) {
  if (!key) {
    return Math.max(...array.filter(n => typeof n === 'number'));
  }

  return Math.max(...array.map(item => item[key]));
}

/**
 * Sleep/promesa delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry con backoff exponencial
 */
export async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry = null,
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(error, attempt + 1, maxRetries);
        }
        await sleep(currentDelay);
        currentDelay *= backoff;
      }
    }
  }

  throw lastError;
}

/**
 * Timeout para promesa
 */
export function withTimeout(promise, ms, errorMessage = 'Timeout') {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Debounce para funciones
 */
export function debounce(fn, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle para funciones
 */
export function throttle(fn, limit) {
  let inThrottle;

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generar QR data (simplificado)
 */
export function generateQRData(data) {
  // Para QR real, usar librería como qrcode
  return JSON.stringify(data);
}

/**
 * Comprimir datos (simplificado)
 */
export function compress(data) {
  return JSON.stringify(data);
}

/**
 * Descomprimir datos
 */
export function decompress(compressed) {
  return JSON.parse(compressed);
}

/**
 * Calcular checksum
 */
export function calculateChecksum(data) {
  return createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
}

/**
 * Verificar integridad de datos
 */
export function verifyIntegrity(data, checksum) {
  return calculateChecksum(data) === checksum;
}

/**
 * Exportar todas las utilidades
 */
export default {
  generateId,
  generateCode,
  hashPassword,
  verifyPassword,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  daysBetween,
  isExpired,
  calculateAge,
  sanitizeString,
  normalizeString,
  normalizeForSearch,
  isValidEmail,
  isValidRNC,
  parseNumber,
  deepClone,
  deepMerge,
  getNestedValue,
  setNestedValue,
  omit,
  pick,
  groupBy,
  sortBy,
  unique,
  chunk,
  sum,
  average,
  min,
  max,
  sleep,
  retry,
  withTimeout,
  debounce,
  throttle,
  generateQRData,
  compress,
  decompress,
  calculateChecksum,
  verifyIntegrity,
};
