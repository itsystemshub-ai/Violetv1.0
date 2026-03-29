/**
 * Violet ERP - Utilidades compartidas
 * 
 * Funciones utilitarias utilizadas en toda la aplicación Violet ERP.
 */

import { format, parseISO, isValid, addDays, addMonths, addYears, differenceInDays, differenceInMonths } from 'date-fns';
import { z } from 'zod';

// ============================================================================
# FORMATO DE MONEDA Y NÚMEROS
// ============================================================================

export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'es-DO'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (
  value: number,
  options?: {
    decimals?: number;
    locale?: string;
    showSign?: boolean;
  }
): string => {
  const { decimals = 2, locale = 'es-DO', showSign = false } = options || {};
  
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  
  if (showSign && value > 0) {
    return `+${formatted}`;
  }
  
  return formatted;
};

export const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
};

export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const calculateDiscount = (original: number, discount: number): number => {
  return original - (original * (discount / 100));
};

export const calculateTax = (amount: number, taxRate: number): number => {
  return amount * (taxRate / 100);
};

export const calculateTotal = (
  subtotal: number,
  discount: number = 0,
  taxRate: number = 0
): number => {
  const afterDiscount = subtotal - discount;
  const tax = calculateTax(afterDiscount, taxRate);
  return afterDiscount + tax;
};

// ============================================================================
# FORMATO DE FECHAS
// ============================================================================

export const formatDate = (
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy',
  locale?: string
): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, formatStr);
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatRelativeDate = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  
  const now = new Date();
  const diff = differenceInDays(now, parsed);
  
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  if (diff < 30) return `Hace ${Math.floor(diff / 7)} semanas`;
  if (diff < 365) return `Hace ${Math.floor(diff / 30)} meses`;
  return `Hace ${Math.floor(diff / 365)} años`;
};

export const addBusinessDays = (date: Date | string, days: number): Date => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  let result = new Date(parsed);
  let added = 0;
  
  while (added < days) {
    result = addDays(result, 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return result;
};

export const isDateBetween = (
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  const startParsed = typeof start === 'string' ? parseISO(start) : start;
  const endParsed = typeof end === 'string' ? parseISO(end) : end;
  
  return parsed >= startParsed && parsed <= endParsed;
};

export const getDaysDifference = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d2, d1);
};

export const getMonthsDifference = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInMonths(d2, d1);
};

// ============================================================================
# VALIDACIONES
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidTaxId = (taxId: string): boolean => {
  // Validación básica para RNC/Cédula en República Dominicana
  const rncRegex = /^\d{9}$/;
  const cedulaRegex = /^\d{11}$/;
  return rncRegex.test(taxId.replace(/\D/g, '')) || cedulaRegex.test(taxId.replace(/\D/g, ''));
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export const isNotEmpty = (value: unknown): boolean => {
  return !isEmpty(value);
};

// ============================================================================
# MANIPULACIÓN DE STRINGS
// ============================================================================

export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
};

export const generateCode = (prefix: string = '', length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

export const generateInvoiceNumber = (sequence: number, prefix: string = 'FAC'): string => {
  const padded = sequence.toString().padStart(8, '0');
  return `${prefix}-${padded}`;
};

// ============================================================================
# MANIPULACIÓN DE OBJETOS
# ============================================================================

export const omit = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result;
};

export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      acc[newKey] = value;
    }
    
    return acc;
  }, {} as Record<string, unknown>);
};

// ============================================================================
# MANIPULACIÓN DE ARRAYS
# ============================================================================

export const unique = <T>(arr: T[], key?: keyof T): T[] => {
  if (!key) return [...new Set(arr)];
  const seen = new Set<T[keyof T]>();
  return arr.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
  return arr.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

// ============================================================================
# SCHEMAS ZOD COMUNES
# ============================================================================

export const emailSchema = z.string().email('Email inválido');
export const phoneSchema = z.string().min(10, 'Teléfono inválido');
export const requiredString = z.string().min(1, 'Campo requerido');
export const positiveNumber = z.number().positive('Debe ser mayor a 0');
export const optionalString = z.string().optional();

export const moneySchema = z.object({
  amount: positiveNumber,
  currency: z.string().default('USD'),
});

export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.startDate <= data.endDate, {
  message: 'La fecha de inicio debe ser anterior a la fecha de fin',
});

// ============================================================================
# UTILIDADES DE NEGOCIO
# ============================================================================

export const getInitials = (firstName: string, lastName: string): string => {
  const f = firstName?.charAt(0) || '';
  const l = lastName?.charAt(0) || '';
  return `${f}${l}`.toUpperCase();
};

export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

export const getFullAddress = (address: {
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string => {
  const parts = [
    address.street,
    address.street2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const calculateAge = (birthDate: Date | string): number => {
  const parsed = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
  const today = new Date();
  const birth = new Date(parsed);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const getNextBusinessDay = (date: Date | string): Date => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  let result = addDays(parsed, 1);
  
  while (result.getDay() === 0 || result.getDay() === 6) {
    result = addDays(result, 1);
  }
  
  return result;
};

export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const round = (value: number, decimals: number = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};
