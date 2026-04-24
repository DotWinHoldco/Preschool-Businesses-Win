import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export type CardProps = HTMLAttributes<HTMLDivElement>

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)]',
      'shadow-[0_1px_2px_rgba(28,28,40,.04),0_8px_24px_-8px_rgba(28,28,40,.08)]',
      'transition-shadow hover:shadow-[0_2px_4px_rgba(28,28,40,.06),0_24px_48px_-12px_rgba(37,99,235,.12)]',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
))
CardHeader.displayName = 'CardHeader'

// ---------------------------------------------------------------------------
// CardTitle
// ---------------------------------------------------------------------------

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-tight text-[var(--color-foreground)]', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

// ---------------------------------------------------------------------------
// CardDescription
// ---------------------------------------------------------------------------

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-[var(--color-muted-foreground)]', className)}
      {...props}
    />
  ),
)
CardDescription.displayName = 'CardDescription'

// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------

export type CardContentProps = HTMLAttributes<HTMLDivElement>

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------

export type CardFooterProps = HTMLAttributes<HTMLDivElement>

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
