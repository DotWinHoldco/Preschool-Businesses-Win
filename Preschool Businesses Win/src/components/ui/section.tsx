import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  bg?: string
}

const Section = forwardRef<HTMLElement, SectionProps>(
  ({ bg, className, style, ...props }, ref) => (
    <section
      ref={ref}
      className={cn('py-20 md:py-28 lg:py-36', className)}
      style={bg ? { backgroundColor: bg, ...style } : style}
      {...props}
    />
  ),
)

Section.displayName = 'Section'

export { Section }
