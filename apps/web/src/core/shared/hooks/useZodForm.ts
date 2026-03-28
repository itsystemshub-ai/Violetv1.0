/**
 * Hook personalizado para integrar Zod con React Hook Form
 * Proporciona validación automática y mensajes de error amigables
 */

import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

/**
 * Opciones extendidas para el hook
 */
interface UseZodFormOptions<TSchema extends z.ZodType<any, any, any>>
  extends Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> {
  schema: TSchema;
  showErrorToast?: boolean;
  errorToastTitle?: string;
}

/**
 * Hook que combina react-hook-form con Zod
 */
export function useZodForm<TSchema extends z.ZodType<any, any, any>>(
  options: UseZodFormOptions<TSchema>
): UseFormReturn<z.infer<TSchema>> {
  const { schema, showErrorToast = true, errorToastTitle = 'Error de validación', ...formOptions } = options;

  const form = useForm<z.infer<TSchema>>({
    ...formOptions,
    resolver: zodResolver(schema),
  });

  // Interceptar errores de validación
  const originalHandleSubmit = form.handleSubmit;
  form.handleSubmit = (onValid, onInvalid) => {
    return originalHandleSubmit(
      onValid,
      (errors) => {
        // Mostrar toast con el primer error
        if (showErrorToast && Object.keys(errors).length > 0) {
          const firstError = Object.values(errors)[0];
          if (firstError?.message) {
            toast.error(errorToastTitle, {
              description: firstError.message as string,
            });
          }
        }

        // Llamar callback personalizado si existe
        if (onInvalid) {
          onInvalid(errors);
        }
      }
    );
  };

  return form;
}

/**
 * Valida datos con un schema de Zod sin formulario
 */
export function validateWithZod<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  data: unknown
): { success: true; data: z.infer<TSchema> } | { success: false; errors: z.ZodError } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Valida datos de forma asíncrona
 */
export async function validateWithZodAsync<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  data: unknown
): Promise<{ success: true; data: z.infer<TSchema> } | { success: false; errors: z.ZodError }> {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Formatea errores de Zod para mostrar al usuario
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  
  return formatted;
}

/**
 * Obtiene el primer error de Zod
 */
export function getFirstZodError(error: z.ZodError): string | null {
  if (error.errors.length > 0) {
    return error.errors[0].message;
  }
  return null;
}

/**
 * Valida un campo individual
 */
export function validateField<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  fieldName: string,
  value: unknown
): { valid: true } | { valid: false; error: string } {
  try {
    // Crear un objeto parcial con solo el campo a validar
    const data = { [fieldName]: value };
    schema.parse(data);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find((err) => err.path[0] === fieldName);
      if (fieldError) {
        return { valid: false, error: fieldError.message };
      }
    }
    return { valid: false, error: 'Error de validación' };
  }
}
