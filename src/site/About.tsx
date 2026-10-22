import { useContact } from './ContactModal'
import { Eye, HeartHandshake, Hammer, ShieldCheck } from 'lucide-react'
import { BUSINESS } from './content'
import PageHero from './PageHero'
import { Reveal } from './Reveal'
import Spotlight from './Spotlight'

const VALUES = [
  { icon: Hammer, title: 'Craftsmanship', text: 'We repair to the manufacturer standard, not to "good enough".' },
  { icon: Eye, title: 'Transparency', text: 'Photos, updates and itemised estimates, so you always know where your car is.' },
  { icon: ShieldCheck, title: 'Accountability', text: 'Every repair is inspected by a supervisor. Failed checks go back for rework.' },
  { icon: HeartHandshake, title: 'Respect for you', text: 'We explain things plainly and never start extra work without your approval.' },
]

export default function About() {
  const { open: openContact } = useContact()
  return (
    <>
      <PageHero eyebrow="About us" title={<>A workshop built around <span className="text-gradient">getting it right.</span></>} image="/images/shop-floor.jpg" position="center 40%">
        {BUSINESS.name} is an auto body and collision repair workshop. We repair accident damage, restore paint, and fix the mechanical parts that crashes leave behind.
      </PageHero>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl font-bold">Document. Repair. Inspect. Deliver.</h2>
          <p className="text-ink-300 text-lg mt-5">Our process is simple: record the damage, agree the estimate, repair carefully, and have a supervisor inspect the finished work before the keys go back to you.</p>
          <p className="text-ink-300 text-lg mt-4">If a repair does not pass, it is reworked first. Every job is tracked from check-in to delivery, with photos and time records, so nothing is missed.</p>
          <button onClick={() => openContact()} className="btn-primary mt-7 inline-flex min-h-[52px] px-7">Talk to us</button>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative">
            <img src="/images/polish-dark.jpg" alt="Technician machine-polishing a car bonnet" loading="lazy" className="rounded-3xl border border-white/10 w-full aspect-[4/3] object-cover" />
            <img src="/images/mechanic.jpg" alt="Mechanic working on an engine" loading="lazy" className="hidden sm:block absolute -bottom-8 -left-8 w-2/5 rounded-2xl border-4 border-ink-950 aspect-[4/3] object-cover shadow-2xl" />
          </div>
        </Reveal>
      </section>

      <section className="bg-ink-900/60 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
          <Reveal><h2 className="font-display text-4xl sm:text-5xl font-bold mb-12">What we stand for</h2></Reveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06}>
                <Spotlight className="p-7 h-full flex gap-5">
                  <span className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-brand-400 to-red-600 text-white grid place-items-center"><v.icon size={26} /></span>
                  <div><h3 className="font-display text-xl font-semibold">{v.title}</h3><p className="text-ink-400 mt-1">{v.text}</p></div>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <Reveal>
          <img src="/images/lift.jpg" alt="Car on a vehicle lift in the workshop" loading="lazy" className="rounded-3xl border border-white/10 w-full aspect-[4/5] object-cover" style={{ objectPosition: 'center 40%' }} />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="font-display text-4xl sm:text-5xl font-bold">Our team</h2>
          <p className="text-ink-300 text-lg mt-4">Technicians work under supervisors who inspect every job. Specialists for every stage of the repair:</p>
          <ul className="mt-6 space-y-3">
            {['Body & dent specialists', 'Paint & colour-matching technicians', 'Mechanical technicians', 'Supervisors & quality inspectors', 'Insurance & estimating desk'].map((t) => (
              <li key={t} className="flex items-center gap-3 rounded-xl border border-white/10 bg-ink-900/70 px-5 py-4"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" />{t}</li>
            ))}
          </ul>
        </Reveal>
      </section>
    </>
  )
}
