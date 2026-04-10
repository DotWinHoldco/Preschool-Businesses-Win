import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

const Container = forwardRef<HTMLDivElement, ContainerProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mx-auto max-w-7xl px-6 md:px-10', className)} {...props} />
))

Container.displayName = 'Container'

export { Container }
