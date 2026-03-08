/**
 * ValeryForm - Formulario estilo Valery Profesional
 * Diseño clásico con labels a la izquierda y campos a la derecha
 */

import React from 'react';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { cn } from '@/core/shared/utils/utils';

export interface ValeryFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'date' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: any;
  options?: { value: string; label: string }[];
  rows?: number;
  onChange?: (value: any) => void;
}

export interface ValeryFormSection {
  title?: string;
  fields: ValeryFormField[];
}

export interface ValeryFormProps {
  title?: string;
  sections: ValeryFormSection[];
  onSubmit?: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  className?: string;
}

export const ValeryForm: React.FC<ValeryFormProps> = ({
  title,
  sections,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  className,
}) => {
  const [formData, setFormData] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.value !== undefined) {
          initialData[field.name] = field.value;
        }
      });
    });
    setFormData(initialData);
  }, [sections]);

  const handleChange = (name: string, value: any, onChange?: (value: any) => void) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (onChange) {
      onChange(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const renderField = (field: ValeryFormField) => {
    const value = formData[field.name] ?? field.value ?? '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.name}
            name={field.name}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || isLoading}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value, field.onChange)}
            rows={field.rows || 3}
            className="resize-none"
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleChange(field.name, val, field.onChange)}
            disabled={field.disabled || isLoading}
          >
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={field.placeholder || 'Seleccionar...'} />
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

      default:
        return (
          <Input
            id={field.name}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            disabled={field.disabled || isLoading}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value, field.onChange)}
          />
        );
    }
  };

  return (
    <Card className={cn('border-2', className)}>
      {title && (
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              {section.title && (
                <h3 className="text-sm font-bold text-primary uppercase tracking-wide border-b pb-2">
                  {section.title}
                </h3>
              )}
              <div className="space-y-4">
                {section.fields.map((field) => (
                  <div
                    key={field.name}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start"
                  >
                    <Label
                      htmlFor={field.name}
                      className="md:text-right pt-2 font-medium text-sm"
                    >
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="md:col-span-3">{renderField(field)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {cancelLabel}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ValeryForm;
