import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export const Reveal = ({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
)

// Headline whose words rise into view one by one (variants live on an unclipped parent so in-view detection works)
const list = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const word = { hidden: { y: '110%' }, show: { y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const } } }

export function Words({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span className={className} aria-label={text} variants={list} initial="hidden" whileInView="show" viewport={{ once: true }}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-1 -mb-1" aria-hidden>
          <motion.span className="inline-block" variants={word}>{w}&nbsp;</motion.span>
        </span>
      ))}
    </motion.span>
  )
}
