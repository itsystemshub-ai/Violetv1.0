/**
 * Schemas de validación para usuarios usando Zod
 */

import { z } from 'zod';
import { ALL_PERMISSIONS } from '@/lib';

/**
 * Schema para login
 */
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  
  tenantId: z.string().uuid().optional(),
});

/**
 * Schema para registro de usuario
 */
export const registerUserSchema = z.object({
  username: z.string()
    .min(3, 'El usuario debe tener al menos 3 caracteres')
    .max(50, 'El usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  
  confirmPassword: z.string(),
  
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional(),
  
  role: z.enum(['super_admin', 'admin', 'gerente', 'almacen', 'contador', 'recursos_humanos', 'cliente']),
  
  department: z.string().max(100).optional(),
  
  tenantId: z.string().uuid('ID de tenant inválido'),
  
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/**
 * Schema para actualizar usuario
 */
export const updateUserSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional(),
  
  role: z.enum(['super_admin', 'admin', 'gerente', 'almacen', 'contador', 'recursos_humanos', 'cliente'])
    .optional(),
  
  department: z.string().max(100).optional(),
  
  avatarUrl: z.string().url('URL inválida').optional(),
  
  is2FAEnabled: z.boolean().optional(),
  
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).optional(),
});

/**
 * Schema para cambio de contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  
  newPassword: z.string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contraseña debe ser diferente a la actual',
  path: ['newPassword'],
});

/**
 * Schema para reseteo de contraseña
 */
export const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

/**
 * Tipos TypeScript inferidos
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Funciones helper de validación
 */
export const validateLogin = (data: unknown) => {
  return loginSchema.safeParse(data);
};

export const validateRegisterUser = (data: unknown) => {
  return registerUserSchema.safeParse(data);
};

export const validateUpdateUser = (data: unknown) => {
  return updateUserSchema.safeParse(data);
};

export const validateChangePassword = (data: unknown) => {
  return changePasswordSchema.safeParse(data);
};
