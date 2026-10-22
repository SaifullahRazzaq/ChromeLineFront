import { useSearchParams } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { BUSINESS } from './content'
import ContactForm from './ContactForm'
import PageHero from './PageHero'

export default function Contact() {
  const [params] = useSearchParams()
  return (
    <>
    <PageHero eyebrow="Contact us" title={<>Get a <span className="text-gradient">free quote.</span></>} image="/images/crash-white.jpg" position="center 60%">Tell us about your vehicle and what happened. We will reply by phone or email.</PageHero>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-[1.3fr_1fr] gap-10">
      <div><ContactForm initialService={params.get('service') ?? undefined} /></div>
      <aside className="space-y-4">
        <div className="card p-6 space-y-4 text-sm">
          <h2 className="font-semibold text-lg text-white">Workshop details</h2>
          <p className="flex gap-3"><MapPin size={18} className="text-brand-400 shrink-0" />{BUSINESS.address}</p>
          <p className="flex gap-3"><Phone size={18} className="text-brand-400 shrink-0" /><a className="hover:text-white" href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a></p>
          <p className="flex gap-3"><Mail size={18} className="text-brand-400 shrink-0" /><a className="hover:text-white" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
        </div>
        <div className="card p-6 text-sm">
          <h2 className="font-semibold text-lg text-white mb-3 flex items-center gap-2"><Clock size={18} className="text-brand-400" /> Opening hours</h2>
          <ul className="space-y-2">{BUSINESS.hours.map(([d, t]) => <li key={d} className="flex justify-between gap-3"><span className="text-ink-400">{d}</span><span className="text-white">{t}</span></li>)}</ul>
        </div>
      </aside>
    </div>
    </>
  )
}
