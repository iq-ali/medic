import type { Variants, Transition } from 'framer-motion'

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
}

export const pageTransition: Transition = { duration: 0.22, ease: 'easeOut' }

export const containerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.055 } },
}

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const sectionContainerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const sectionVariants: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const cardHover = {
  whileHover: { y: -3, transition: { duration: 0.2, ease: 'easeOut' as const } },
}

export const rowVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}

export const rowContainerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
}
