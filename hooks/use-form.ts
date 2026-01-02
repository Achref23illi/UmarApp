/**
 * Form Hook Utilities
 * =====================
 * Reusable form hooks with React Hook Form + Zod
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { FieldValues, Path, UseFormReturn } from 'react-hook-form';

/**
 * Get error message for a field
 */
export function getFieldError<T extends FieldValues>(
  errors: UseFormReturn<T>['formState']['errors'],
  field: Path<T>
): string | undefined {
  const error = errors[field];
  return error?.message as string | undefined;
}

/**
 * Check if form has any errors
 */
export function hasFormErrors<T extends FieldValues>(
  errors: UseFormReturn<T>['formState']['errors']
): boolean {
  return Object.keys(errors).length > 0;
}

// Export zodResolver for use with useForm
export { zodResolver };

// Re-export react-hook-form utilities
export { useController, useForm, useFormState, useWatch } from 'react-hook-form';
export type { Control, DefaultValues, FieldErrors, UseFormReturn } from 'react-hook-form';
