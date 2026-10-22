import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, BadgeCheck, Camera, CheckCircle2, ChevronDown, ClipboardCheck, Phone, ScanSearch, ShieldCheck } from 'lucide-react'
import { BUSINESS, SERVICES } from './content'
import BeforeAfter from './BeforeAfter'
import StickyProcess from './StickyProcess'
import HorizontalGallery from './HorizontalGallery'
import Spotlight from './Spotlight'
import { Reveal, Words } from './Reveal'

const WHY = [
  { icon: ClipboardCheck, title: 'Every repair inspected', text: 'A supervisor signs off each job. If it is not right, it goes back for rework — not out the door.' },
  { icon: Camera, title: 'Photo-documented', text: 'Before, during and after photos on every vehicle, so there are no surprises.' },
  { icon: ShieldCheck, title: 'Insurance handled', text: 'We prepare the paperwork and deal with your insurer directly.' },
  { icon: BadgeCheck, title: 'Approval first', text: 'You approve the estimate before work starts. Extra work needs your OK first.' },
]

export default function Home() {
  const hero = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <>
      {/* HERO */}
      <section ref={hero} className="relative h-[100svh] min-h-[620px] overflow-hidden -mt-16">
        <motion.img src="/images/hero-sanding.jpg" alt="Technician sanding a car panel in the workshop" style={{ y: imgY, scale: imgScale }} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/30" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-500/30 blur-[140px]" aria-hidden />

        <motion.div style={{ y: textY, opacity: fade }} className="relative h-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center pt-16">
          <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex self-start items-center gap-2 rounded-full glass text-xs font-semibold px-3.5 py-1.5 text-brand-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Now booking collision & paint repairs
          </motion.span>
          <h1 className="font-display text-5xl sm:text-7xl lg:text-[6.5rem] font-bold leading-[0.95] mt-6">
            <Words text="Wrecked to" /><br /><span className="text-gradient"><Words text="flawless." /></span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }} className="mt-6 text-lg sm:text-xl text-ink-200 max-w-xl">
            {BUSINESS.name} repairs, repaints and restores your car to showroom standard — every job photographed, tracked and inspected before it leaves.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.7 }} className="mt-9 flex flex-wrap gap-3">
            <Link to="/contact" className="btn-primary min-h-[56px] px-7 text-base shadow-[0_0_50px_-6px_rgba(249,115,22,.9)]">Get a free quote <ArrowRight size={18} /></Link>
            <Link to="/track" className="btn glass min-h-[56px] px-7 text-base text-white hover:bg-white/10"><ScanSearch size={18} /> Track your repair</Link>
          </motion.div>
          <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 mt-6 text-ink-300 hover:text-white self-start"><Phone size={16} className="text-brand-400" /> or call {BUSINESS.phone}</a>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }} className="hidden lg:flex absolute right-10 bottom-28 glass rounded-2xl p-4 w-64 flex-col gap-2">
          <div className="flex items-center gap-2 text-sm"><CheckCircle2 className="text-emerald-400" size={18} /> Quality check passed</div>
          <div className="flex items-center justify-between text-xs text-ink-300"><span>Repair progress</span><span className="text-brand-300 font-semibold">72%</span></div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden"><motion.div className="h-full bg-gradient-to-r from-brand-400 to-red-500" initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ delay: 1.8, duration: 1.4 }} /></div>
          <div className="text-[11px] text-ink-500">Sample of live Track Repair</div>
        </motion.div>
        <motion.div style={{ opacity: fade }} className="absolute bottom-6 inset-x-0 flex justify-center text-ink-300" aria-hidden><ChevronDown className="animate-bounce" /></motion.div>
      </section>

      {/* MARQUEE */}
      <div className="border-y border-white/10 bg-ink-900/80 overflow-hidden py-4" aria-hidden>
        <div className="flex w-max animate-marquee">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center">
              {[...SERVICES.map((s) => s.title), 'Colour matching', 'Dent removal', 'Bumper repair', 'Frame straightening', 'Free estimates'].map((t) => (
                <span key={t + k} className="font-display text-xl sm:text-2xl font-semibold text-ink-400 px-8 flex items-center gap-8 whitespace-nowrap">{t}<span className="text-brand-500">✦</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <Reveal className="max-w-2xl">
          <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Services</span>
          <h2 className="font-display text-4xl sm:text-6xl font-bold mt-2">Everything after the impact.</h2>
        </Reveal>
        <div className="grid md:grid-cols-6 gap-4 sm:gap-5 mt-12">
          {SERVICES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.06} className={i < 2 ? 'md:col-span-3' : 'md:col-span-2'}>
              <Link to={`/services#${s.id}`} className={`group relative block rounded-3xl overflow-hidden border border-white/10 ${i < 2 ? 'h-[340px] sm:h-[420px]' : 'h-[340px]'}`}>
                <img src={s.image} alt={s.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent group-hover:via-ink-950/70 transition-colors" />
                <span className="absolute top-5 right-6 font-display text-6xl font-bold text-white/20">0{i + 1}</span>
                <div className="absolute bottom-0 p-6 sm:p-7">
                  <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-red-600 text-white grid place-items-center mb-4 shadow-lg shadow-brand-500/40"><s.icon size={22} /></span>
                  <h3 className="font-display text-2xl sm:text-3xl font-semibold">{s.title}</h3>
                  <p className="text-ink-300 text-sm mt-1.5 max-w-sm">{s.short}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-brand-300 mt-3 group-hover:gap-2 transition-all">Explore <ArrowRight size={15} /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PINNED PROCESS */}
      <div className="border-y border-white/10 bg-ink-900/60"><StickyProcess /></div>

      {/* BEFORE / AFTER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        <Reveal className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">The difference</span>
          <h2 className="font-display text-4xl sm:text-6xl font-bold mt-2">Drag. See it come back.</h2>
        </Reveal>
        <Reveal><BeforeAfter /></Reveal>
      </section>

      {/* HORIZONTAL GALLERY */}
      <div className="bg-ink-900/60 border-y border-white/10"><HorizontalGallery /></div>

      {/* WHY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <Reveal className="max-w-2xl mb-12">
          <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Why {BUSINESS.name}</span>
          <h2 className="font-display text-4xl sm:text-6xl font-bold mt-2">A workshop that shows its work.</h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.07}>
              <Spotlight className="h-full p-6">
                <w.icon className="text-brand-400 mb-4" size={30} />
                <h3 className="font-display text-xl font-semibold">{w.title}</h3>
                <p className="text-sm text-ink-400 mt-2">{w.text}</p>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TRACK CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[340px] flex items-center">
            <img src="/images/dark-sedan.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/30" />
            <div className="relative p-8 sm:p-14 max-w-xl">
              <h2 className="font-display text-4xl sm:text-5xl font-bold">Your repair, <span className="text-gradient">live.</span></h2>
              <p className="text-ink-300 mt-3 text-lg">Already dropped your car off? Follow it from repair to quality check without picking up the phone.</p>
              <Link to="/track" className="btn-primary min-h-[56px] px-8 text-base mt-7 inline-flex"><ScanSearch size={19} /> Track my car</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-20 text-center">
            <img src="/images/crash-frontal.jpg" alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/95 via-brand-700/90 to-red-800/95" />
            <h2 className="relative font-display text-4xl sm:text-6xl font-bold text-white">Had an accident? Let's sort it.</h2>
            <p className="relative text-white/90 mt-4 text-lg max-w-xl mx-auto">Send us a few details and photos. We'll come back with a clear estimate and handle the insurer too.</p>
            <Link to="/contact" className="relative btn bg-white text-brand-700 hover:bg-ink-200 min-h-[56px] px-8 text-base mt-8">Request a free quote <ArrowRight size={18} /></Link>
          </div>
        </Reveal>
      </section>
    </>
  )
}
