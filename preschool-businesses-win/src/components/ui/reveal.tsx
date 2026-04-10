'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fadeUp } from '@/lib/motion'
import { cn } from '@/lib/cn'

export interface RevealProps {
  children: ReactNode
  className?: string
  /** Override the default animation variants */
  variants?: typeof fadeUp
  /** Delay in seconds */
  delay?: number
}

function Reveal({ children, className, variants = fadeUp, delay }: RevealProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      variants={variants}
      transition={delay ? { delay } : undefined}
    >
      {children}
    </motion.div>
  )
}

export { Reveal }
