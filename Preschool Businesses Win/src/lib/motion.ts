// @anchor: brand.motion
// Motion presets derived from BRAND.md

export const easeOutExpo = [0.16, 1, 0.3, 1] as const
export const easeInOutSoft = [0.65, 0, 0.35, 1] as const
export const easeOutSnap = [0.22, 1, 0.36, 1] as const

/** Fade-up reveal — hidden state blurs and offsets, show state resolves */
export const fadeUp = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(8px)',
  },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: easeOutExpo,
    },
  },
} as const

/** Stagger container — orchestrates child animations */
export const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
} as const

/** Subtle press feedback for interactive elements */
export const scaleOnTap = {
  whileTap: { scale: 0.97 },
} as const

/** Standard viewport trigger settings for whileInView animations */
export const viewportSettings = {
  once: true,
  amount: 0.2,
  margin: '-50px',
} as const
