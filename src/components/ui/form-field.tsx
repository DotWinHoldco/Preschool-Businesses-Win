'use client'

import { useId, type ReactNode } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Basic FormField wrapper (no react-hook-form)
// ---------------------------------------------------------------------------

export interface FormFieldWrapperProps {
  label: string
  htmlFor?: string
  error?: string
  description?: string
  required?: boolean
  children: ReactNode
  className?: string
}

function FormFieldWrapper({
  label,
  htmlFor,
  error,
  description,
  required = false,
  children,
  className,
}: FormFieldWrapperProps) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId
  const errorId = `${id}-error`
  const descId = `${id}-desc`

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className="text-sm font-medium text-[var(--color-foreground)]"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-[var(--color-destructive)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {description && (
        <p id={descId} className="text-xs text-[var(--color-muted-foreground)]">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// React Hook Form integrated FormField
// ---------------------------------------------------------------------------

export interface RHFFormFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label: string
  description?: string
  required?: boolean
  className?: string
  render: (field: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: any
    error?: string
    id: string
    errorId: string
    descId: string
  }) => ReactNode
}

function RHFFormField<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required = false,
  className,
  render,
}: RHFFormFieldProps<T>) {
  const generatedId = useId()
  const id = `${generatedId}-${name}`
  const errorId = `${id}-error`
  const descId = `${id}-desc`

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('flex flex-col gap-1.5', className)}>
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--color-foreground)]"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-[var(--color-destructive)]" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {description && (
            <p id={descId} className="text-xs text-[var(--color-muted-foreground)]">
              {description}
            </p>
          )}
          {render({
            field: {
              ...field,
              id,
              'aria-describedby': [
                description ? descId : null,
                fieldState.error ? errorId : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined,
              'aria-invalid': !!fieldState.error || undefined,
            },
            error: fieldState.error?.message,
            id,
            errorId,
            descId,
          })}
          {fieldState.error?.message && (
            <p id={errorId} role="alert" className="text-sm text-[var(--color-destructive)]">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}

export { FormFieldWrapper, RHFFormField }
