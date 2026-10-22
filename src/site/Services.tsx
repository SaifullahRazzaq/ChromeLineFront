import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check } from 'lucide-react'
import clsx from 'clsx'
import { SERVICES } from './content'
import PageHero from './PageHero'
import { Reveal } from './Reveal'

export default function Services() {
  const { hash } = useLocation()
  useEffect(() => { if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80) }, [hash])

  return (
    <>
      <PageHero eyebrow="Services" title={<>Everything your car needs <span className="text-gradient">after damage.</span></>} image="/images/hero-sanding.jpg">
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => <a key={s.id} href={`#${s.id}`} className="rounded-full glass px-4 min-h-[40px] inline-flex items-center text-sm text-ink-200 hover:border-brand-500 hover:text-white">{s.title}</a>)}
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 space-y-24">
        {SERVICES.map((s, i) => (
          <section key={s.id} id={s.id} className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center scroll-mt-24">
            <Reveal className={clsx(i % 2 && 'lg:order-2')}>
              <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/3] group">
                <img src={s.image} alt={s.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
                <span className="absolute top-5 left-6 font-display text-7xl font-bold text-white/30">0{i + 1}</span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-red-600 text-white grid place-items-center mb-5 shadow-lg shadow-brand-500/30"><s.icon size={28} /></span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold">{s.title}</h2>
              <p className="text-ink-300 text-lg mt-4">{s.long}</p>
              <ul className="mt-6 grid sm:grid-cols-2 gap-3">
                {s.points.map((p) => <li key={p} className="flex gap-3 text-sm"><Check size={18} className="text-brand-400 shrink-0 mt-0.5" />{p}</li>)}
              </ul>
              <Link to={`/contact?service=${encodeURIComponent(s.title)}`} className="btn-primary mt-8 inline-flex min-h-[52px] px-7">Request a quote</Link>
            </Reveal>
          </section>
        ))}
      </div>
    </>
  )
}
