import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorNote, Field } from '../components/ui'
import { BUSINESS, SERVICES } from './content'
import PageHero from './PageHero'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const [params] = useSearchParams()
  const initial = SERVICES.find((s) => s.title === params.get('service'))?.title ?? SERVICES[0].title
  const [f, setF] = useState({ name: '', email: '', phone: '', service: initial, vehicle: '', message: '', website: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k: string, v: string) => { setF((s) => ({ ...s, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })) }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!f.name.trim()) errs.name = 'Please enter your name'
    if (!EMAIL.test(f.email)) errs.email = 'Enter a valid email address'
    if (!/^[+\d][\d\s\-()]{6,}$/.test(f.phone.trim())) errs.phone = 'Enter a valid phone number'
    if (f.message.trim().length < 10) errs.message = 'Tell us a little more (at least 10 characters)'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setBusy(true); setError('')
    try { await api.post('/contact', f); setSent(true) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  const err = (k: string) => errors[k] && <span className="block text-xs text-red-300 mt-1" role="alert">{errors[k]}</span>

  return (
    <>
    <PageHero eyebrow="Contact us" title={<>Get a <span className="text-gradient">free quote.</span></>} image="/images/crash-white.jpg" position="center 60%">Tell us about your vehicle and what happened. We will reply by phone or email.</PageHero>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-[1.3fr_1fr] gap-10">
      <div>

        {sent ? (
          <div className="card p-8 text-center" role="status">
            <CheckCircle2 className="mx-auto text-emerald-400" size={48} />
            <h2 className="text-2xl font-bold mt-4">Thank you, {f.name.split(' ')[0]}!</h2>
            <p className="text-ink-300 mt-2">We have your request and will get back to you soon. For anything urgent, call {BUSINESS.phone}.</p>
            <button className="btn-ghost mt-6" onClick={() => { setSent(false); setF({ ...f, message: '', vehicle: '' }) }}>Send another message</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="card p-6 space-y-4">
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name *"><input autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name} />{err('name')}</Field>
              <Field label="Phone *"><input type="tel" autoComplete="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} aria-invalid={!!errors.phone} />{err('phone')}</Field>
            </div>
            <Field label="Email *"><input type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email} />{err('email')}</Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Service"><select value={f.service} onChange={(e) => set('service', e.target.value)}>{SERVICES.map((s) => <option key={s.id}>{s.title}</option>)}<option>Other</option></select></Field>
              <Field label="Vehicle (make, model, year)"><input value={f.vehicle} onChange={(e) => set('vehicle', e.target.value)} placeholder="e.g. Honda Civic 2021" /></Field>
            </div>
            <Field label="How can we help? *"><textarea rows={5} value={f.message} onChange={(e) => set('message', e.target.value)} aria-invalid={!!errors.message} />{err('message')}</Field>
            {/* Honeypot: hidden from people, filled by bots */}
            <div className="absolute -left-[9999px]" aria-hidden><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label></div>
            <button className="btn-primary w-full min-h-[52px] text-base" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
        )}
      </div>

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
