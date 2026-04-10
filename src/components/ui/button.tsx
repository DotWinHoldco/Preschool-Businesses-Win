'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

// ---------------------------------------------------------------------------
// Slot (minimal asChild implementation)
// ---------------------------------------------------------------------------

function Slot({
  children,
  ...props
}: { children: ReactNode } & Record<string, unknown>) {
  if (!children || typeof children !== 'object' || !('props' in children)) {
    return <>{children}</>
  }
  // Merge props onto the single child element
  const child = children as React.ReactElement<Record<string, unknown>>
  const merged = { ...props, ...child.props }
  if (props.className && child.props.className) {
    merged.className = cn(props.className as string, child.props.className as string)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...child, props: merged } as any
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  pill?: boolean
  loading?: boolean
  asChild?: boolean
  children?: ReactNode
}

// ---------------------------------------------------------------------------
// Variant / size maps
// ---------------------------------------------------------------------------

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:brightness-110 focus-visible:ring-[var(--color-primary)]',
  secondary:
    'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:ring-[var(--color-primary)]',
  ghost:
    'bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:ring-[var(--color-primary)]',
  danger:
    'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:brightness-110 focus-visible:ring-[var(--color-destructive)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 min-w-[48px] px-3 text-sm gap-1.5',
  md: 'h-12 min-w-[48px] px-5 text-base gap-2',
  lg: 'h-14 min-w-[48px] px-7 text-lg gap-2.5',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      loading = false,
      disabled,
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      'inline-flex items-center justify-center font-semibold transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'select-none',
      pill ? 'rounded-full' : 'rounded-[var(--radius,0.75rem)]',
      variantClasses[variant],
      sizeClasses[size],
      className,
    )

    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <motion.button
        ref={ref}
        whileTap={disabled || loading ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading && <Spinner size="sm" className="shrink-0" />}
        {children}
      </motion.button>
    )
  },
)

Button.displayName = 'Button'

export { Button }
