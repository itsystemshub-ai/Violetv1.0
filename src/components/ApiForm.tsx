import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: string | number;
  validation?: (value: unknown) => string | null;
}

export interface ApiFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  initialData?: Record<string, unknown>;
}

export function ApiForm({
  fields,
  onSubmit,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onCancel,
  loading = false,
  error = null,
  initialData = {},
}: ApiFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(
    fields.reduce((acc, field) => {
      acc[field.name] = initialData[field.name] ?? field.defaultValue ?? '';
      return acc;
    }, {} as Record<string, unknown>)
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = formData[field.name];

      // Required validation
      if (field.required && !value) {
        newErrors[field.name] = `${field.label} es requerido`;
        return;
      }

      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // Error is handled by parent component
      console.error('Form submission error:', err);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name];
    const error = errors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleChange(field.name, val)}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'textarea':
        return (
          <Textarea
            value={String(value)}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={error ? 'border-destructive' : ''}
            rows={4}
          />
        );

      default:
        return (
          <Input
            type={field.type}
            value={String(value)}
            onChange={(e) => {
              const val =
                field.type === 'number'
                  ? parseFloat(e.target.value) || 0
                  : e.target.value;
              handleChange(field.name, val);
            }}
            placeholder={field.placeholder}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {renderField(field)}
          {errors[field.name] && (
            <p className="text-sm text-destructive">{errors[field.name]}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3 justify-end pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Example usage:
 * 
 * const fields: FormField[] = [
 *   {
 *     name: 'name',
 *     label: 'Nombre',
 *     type: 'text',
 *     required: true,
 *     placeholder: 'Ingrese el nombre',
 *   },
 *   {
 *     name: 'email',
 *     label: 'Email',
 *     type: 'email',
 *     required: true,
 *     validation: (value) => {
 *       if (!/\S+@\S+\.\S+/.test(String(value))) {
 *         return 'Email inválido';
 *       }
 *       return null;
 *     },
 *   },
 *   {
 *     name: 'role',
 *     label: 'Rol',
 *     type: 'select',
 *     required: true,
 *     options: [
 *       { value: 'admin', label: 'Administrador' },
 *       { value: 'user', label: 'Usuario' },
 *     ],
 *   },
 * ];
 * 
 * <ApiForm
 *   fields={fields}
 *   onSubmit={async (data) => {
 *     await api.users.create(data);
 *   }}
 *   loading={loading}
 *   error={error}
 * />
 */
