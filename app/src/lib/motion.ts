import type { Variants } from 'framer-motion'

export const fadeSlideUp: Variants = {
  initial:  { opacity: 0, y: 10 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, y: -6, transition: { duration: 0.22 } },
}

export const fadeIn: Variants = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1, transition: { duration: 0.22 } },
  exit:     { opacity: 0, transition: { duration: 0.15 } },
}

export const scaleIn: Variants = {
  initial:  { opacity: 0, scale: 0.96 },
  animate:  { opacity: 1, scale: 1, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
}

export const staggerContainer: Variants = {
  animate:  { transition: { staggerChildren: 0.04 } },
}

export const staggerItem: Variants = {
  initial:  { opacity: 0, y: 8 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}
