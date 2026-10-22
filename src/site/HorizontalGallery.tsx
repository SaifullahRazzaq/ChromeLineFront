import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { GALLERY } from './content'

// Vertical scroll drives a horizontal strip of workshop photos
export default function HorizontalGallery() {
  const ref = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])

  useEffect(() => {
    const measure = () => track.current && setDist(Math.max(0, track.current.scrollWidth - window.innerWidth))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <section ref={ref} style={{ height: '380vh' }} className="relative" aria-label="Inside the workshop">
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mb-8">
          <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Inside the workshop</span>
          <h2 className="font-display text-4xl sm:text-6xl font-bold mt-2">Where the work happens.</h2>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-5 sm:gap-8 pl-4 sm:pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pr-10 w-max">
          {GALLERY.map((g, i) => (
            <figure key={g.title} className="relative shrink-0 w-[78vw] sm:w-[44vw] lg:w-[32vw] h-[52vh] sm:h-[56vh] rounded-3xl overflow-hidden border border-white/10 group">
              <img src={g.image} alt={g.title} loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: g.position }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <span className="absolute top-4 left-5 font-display text-5xl font-bold text-white/25">0{i + 1}</span>
              <figcaption className="absolute bottom-0 p-6"><div className="font-display text-2xl font-semibold">{g.title}</div><div className="text-sm text-ink-300 mt-1">{g.text}</div></figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
