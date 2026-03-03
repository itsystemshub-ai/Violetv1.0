/**
 * Schemas de validación para empleados usando Zod
 */

import { z } from 'zod';

/**
 * Schema para crear un empleado
 */
export const createEmployeeSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  lastName: z.string()
    .min(1, 'El apellido es requerido')
    .max(100, 'El apellido no puede exceder 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  phone: z.string()
    .regex(/^[\d+\-() ]+$/, 'Teléfono inválido')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  
  identification: z.string()
    .regex(/^[VE]-\d{7,8}$/, 'Cédula inválida (formato: V-12345678 o E-12345678)')
    .max(20),
  
  address: z.string()
    .max(500, 'La dirección no puede exceder 500 caracteres')
    .optional(),
  
  birthDate: z.string()
    .datetime('Fecha de nacimiento inválida')
    .refine((date) => {
      const age = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return age >= 18 && age <= 100;
    }, 'El empleado debe tener entre 18 y 100 años'),
  
  hireDate: z.string()
    .datetime('Fecha de contratación inválida')
    .refine((date) => new Date(date) <= new Date(), 'La fecha de contratación no puede ser futura'),
  
  position: z.string()
    .min(1, 'El cargo es requerido')
    .max(100, 'El cargo no puede exceder 100 caracteres'),
  
  department: z.string()
    .min(1, 'El departamento es requerido')
    .max(100, 'El departamento no puede exceder 100 caracteres'),
  
  salary: z.number()
    .positive('El salario debe ser mayor a 0')
    .max(999999999, 'El salario es demasiado alto'),
  
  salaryCurrency: z.enum(['USD', 'VES']).default('USD'),
  
  contractType: z.enum(['indefinido', 'temporal', 'por_proyecto', 'pasantia'])
    .default('indefinido'),
  
  status: z.enum(['active', 'inactive', 'suspended', 'terminated'])
    .default('active'),
  
  emergencyContact: z.object({
    name: z.string().min(1).max(100),
    relationship: z.string().max(50),
    phone: z.string().regex(/^[\d+\-() ]+$/).max(20),
  }).optional(),
  
  bankAccount: z.object({
    bank: z.string().max(100),
    accountNumber: z.string().max(50),
    accountType: z.enum(['ahorro', 'corriente']),
  }).optional(),
  
  notes: z.string().max(1000).optional(),
});

/**
 * Schema para actualizar un empleado
 */
export const updateEmployeeSchema = createEmployeeSchema.partial();

/**
 * Schema para búsqueda de empleados
 */
export const searchEmployeeSchema = z.object({
  query: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'terminated']).optional(),
  limit: z.number().int().positive().max(1000).default(50),
  offset: z.number().int().nonnegative().default(0),
});

/**
 * Schema para nómina
 */
export const payrollSchema = z.object({
  employeeId: z.string().uuid('ID de empleado inválido'),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).refine((period) => new Date(period.end) > new Date(period.start), {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  }),
  baseSalary: z.number().positive(),
  bonuses: z.array(z.object({
    concept: z.string().max(100),
    amount: z.number().positive(),
  })).default([]),
  deductions: z.array(z.object({
    concept: z.string().max(100),
    amount: z.number().positive(),
  })).default([]),
  totalGross: z.number().positive(),
  totalDeductions: z.number().nonnegative(),
  totalNet: z.number().positive(),
  currency: z.enum(['USD', 'VES']).default('USD'),
  paymentDate: z.string().datetime(),
  paymentMethod: z.enum(['transferencia', 'efectivo', 'cheque']),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
});

/**
 * Schema para cambio de status de empleado
 */
export const changeEmployeeStatusSchema = z.object({
  employeeId: z.string().uuid('ID de empleado inválido'),
  newStatus: z.enum(['active', 'inactive', 'suspended', 'terminated']),
  reason: z.string()
    .min(10, 'La razón debe tener al menos 10 caracteres')
    .max(500, 'La razón no puede exceder 500 caracteres'),
  effectiveDate: z.string().datetime(),
});

/**
 * Tipos TypeScript inferidos
 */
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type SearchEmployeeInput = z.infer<typeof searchEmployeeSchema>;
export type PayrollInput = z.infer<typeof payrollSchema>;
export type ChangeEmployeeStatusInput = z.infer<typeof changeEmployeeStatusSchema>;

/**
 * Funciones helper de validación
 */
export const validateEmployee = (data: unknown) => {
  return createEmployeeSchema.safeParse(data);
};

export const validateEmployeeUpdate = (data: unknown) => {
  return updateEmployeeSchema.safeParse(data);
};

export const validatePayroll = (data: unknown) => {
  return payrollSchema.safeParse(data);
};
