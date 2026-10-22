import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function PageHero({ eyebrow, title, image, position, children }: { eyebrow: string; title: ReactNode; image: string; position?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden -mt-16 pt-16">
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: position }} />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-36">
        <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">{eyebrow}</span>
        <h1 className="font-display text-5xl sm:text-7xl font-bold mt-3 max-w-3xl leading-[1]">{title}</h1>
        {children && <div className="mt-6 max-w-2xl text-lg text-ink-200">{children}</div>}
      </motion.div>
    </section>
  )
}
