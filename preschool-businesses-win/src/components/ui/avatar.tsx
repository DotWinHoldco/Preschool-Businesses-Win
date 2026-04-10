'use client'

import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'> {
  size?: AvatarSize
  fallback?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Avatar({ size = 'md', fallback, src, alt = '', className, ...props }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = src && !imgError

  const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : '?'

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] font-semibold',
        sizeClasses[size],
        className,
      )}
      role="img"
      aria-label={alt || fallback || 'avatar'}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
          {...props}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  )
}

export { Avatar }
