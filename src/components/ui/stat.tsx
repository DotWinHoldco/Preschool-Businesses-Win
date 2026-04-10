'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

export interface StatProps {
  value: number
  label: string
  prefix?: string
  suffix?: string
  /** Animation duration in ms */
  duration?: number
  className?: string
}

function Stat({ value, label, prefix = '', suffix = '', duration = 1500, className }: StatProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  const prefersReduced = useReducedMotion()
  const [display, setDisplay] = useState(prefersReduced ? value : 0)

  useEffect(() => {
    if (!isInView || prefersReduced) {
      setDisplay(value)
      return
    }

    let startTime: number | null = null
    let raf: number

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress)
      setDisplay(Math.round(eased * value))

      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [isInView, value, duration, prefersReduced])

  return (
    <div ref={ref} className={cn('flex flex-col items-center gap-1 text-center', className)}>
      <span className="text-4xl font-bold tabular-nums text-[var(--color-primary)] md:text-5xl lg:text-6xl">
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </span>
      <span className="text-sm font-medium text-[var(--color-muted-foreground)] md:text-base">
        {label}
      </span>
    </div>
  )
}

export { Stat }
