import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import clsx from 'clsx'
import { STEPS } from './content'

// Pinned section: the page "sticks" while the user scrolls through the repair steps
export default function StickyProcess() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length))))
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  return (
    <section ref={ref} style={{ height: `${STEPS.length * 85}vh` }} className="relative" aria-label="How a repair works">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-0 lg:gap-12 px-4 sm:px-6 py-6 lg:py-10">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 h-[42vh] lg:h-full order-1">
            {STEPS.map((s, i) => (
              <motion.img key={s.image} src={s.image} alt={s.title} loading="lazy" draggable={false}
                className="absolute inset-0 w-full h-full object-cover"
                initial={false} animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 1.12 }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <div className="absolute bottom-5 left-5 font-display text-7xl sm:text-9xl font-bold text-white/90 leading-none">0{active + 1}</div>
          </div>

          <div className="flex flex-col justify-center order-2 pt-6 lg:pt-0">
            <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">How a repair works</span>
            <div className="relative mt-4 min-h-[190px] sm:min-h-[220px]">
              {STEPS.map((s, i) => (
                <motion.div key={s.title} className="absolute inset-0" initial={false}
                  animate={{ opacity: active === i ? 1 : 0, y: active === i ? 0 : 30 }} transition={{ duration: 0.5 }} aria-hidden={active !== i}>
                  <h2 className="font-display text-4xl sm:text-6xl font-bold">{s.title}</h2>
                  <p className="text-ink-300 text-base sm:text-xl mt-4 max-w-lg">{s.text}</p>
                </motion.div>
              ))}
            </div>
            <ol className="mt-6 flex gap-2" aria-label="Steps">
              {STEPS.map((s, i) => <li key={s.title} className={clsx('h-1.5 flex-1 rounded-full transition-colors', i <= active ? 'bg-brand-500' : 'bg-white/10')} />)}
            </ol>
            <div className="mt-3 h-px bg-white/10 relative"><motion.div className="absolute inset-y-0 left-0 bg-brand-500" style={{ width: bar }} /></div>
            <p className="text-xs text-ink-500 mt-3">Keep scrolling ↓</p>
          </div>
        </div>
      </div>
    </section>
  )
}
