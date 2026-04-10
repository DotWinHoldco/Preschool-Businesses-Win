import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Eyebrow } from './eyebrow'

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: string
  heading: string
  lead?: ReactNode
  align?: 'left' | 'center'
}

function SectionHeader({
  eyebrow,
  heading,
  lead,
  align = 'center',
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
      {...props}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          'text-[28px] font-bold leading-tight tracking-tight text-[var(--color-foreground)] md:text-[36px] lg:text-[44px]',
          'text-balance',
          align === 'center' && 'max-w-3xl',
        )}
      >
        {heading}
      </h2>
      {lead && (
        <p
          className={cn(
            'text-base leading-relaxed text-[var(--color-muted-foreground)] md:text-lg',
            'text-pretty',
            align === 'center' && 'max-w-2xl',
          )}
        >
          {lead}
        </p>
      )}
    </div>
  )
}

export { SectionHeader }
