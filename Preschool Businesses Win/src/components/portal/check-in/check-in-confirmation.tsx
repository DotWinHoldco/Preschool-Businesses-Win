'use client'

// @anchor: cca.checkin.confirmation
// Success state with checkmark animation. Auto-dismiss after 5 seconds.
// See CCA_BUILD_BRIEF.md §7

import { useEffect } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'
import { easeOutExpo } from '@/lib/motion'

interface CheckInConfirmationProps {
  studentName: string
  classroomName?: string
  onDismiss: () => void
  autoDismissMs?: number
  className?: string
}

export function CheckInConfirmation({
  studentName,
  classroomName,
  onDismiss,
  autoDismissMs = 5000,
  className,
}: CheckInConfirmationProps) {
  // Auto-dismiss after timeout
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs)
    return () => clearTimeout(timer)
  }, [onDismiss, autoDismissMs])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className={cn(
        'flex flex-col items-center gap-6 p-8 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: easeOutExpo }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-success)]/15"
      >
        <motion.svg
          viewBox="0 0 52 52"
          className="h-14 w-14"
          initial="hidden"
          animate="visible"
        >
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
          />
          <motion.path
            d="M14 27l8 8 16-16"
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.35, duration: 0.4, ease: easeOutExpo }}
          />
        </motion.svg>
      </motion.div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: easeOutExpo }}
      >
        <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
          {studentName} is checked in!
        </h2>
        {classroomName && (
          <p className="mt-2 text-lg text-[var(--color-muted-foreground)]">
            Heading to <span className="font-semibold text-[var(--color-foreground)]">{classroomName}</span>
          </p>
        )}
        <p className="mt-4 text-[var(--color-muted-foreground)]">
          Have a great day!
        </p>
      </motion.div>

      {/* Tap to dismiss */}
      <motion.button
        type="button"
        onClick={onDismiss}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.3 }}
        className="text-sm text-[var(--color-muted-foreground)] underline hover:text-[var(--color-foreground)] min-h-[48px] min-w-[48px]"
      >
        Tap to dismiss
      </motion.button>
    </motion.div>
  )
}
