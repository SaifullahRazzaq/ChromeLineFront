import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Check, Search } from 'lucide-react'
import { api } from '../lib/api'
import { ErrorNote, Field } from '../components/ui'
import { fmtDateTime } from '../lib/format'
import { BUSINESS } from './content'

interface Result {
  orderNo: string; vehicle: string; status: string; message: string; progress: number
  stages: { id: string; label: string; state: 'done' | 'current' | 'todo' }[]
  estimatedReady: string | null; updatedAt: string
}

export default function Track() {
  const [orderNo, setOrderNo] = useState('')
  const [plate, setPlate] = useState('')
  const [res, setRes] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setRes(null)
    try { setRes(await api.post<Result>('/track', { orderNo, plate })) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="relative overflow-hidden">
      <img src="/images/dark-sedan.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/80 to-ink-950" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <span className="text-brand-400 text-sm font-semibold uppercase tracking-widest">Track your repair</span>
        <h1 className="font-display text-4xl sm:text-6xl font-bold mt-2">Where's my <span className="text-gradient">car?</span></h1>
        <p className="text-ink-300 mt-3 text-lg">Enter the order number from your paperwork and your number plate to see live progress from our workshop floor.</p>

        <form onSubmit={submit} className="glass rounded-2xl p-5 sm:p-6 mt-8 grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <Field label="Order number"><input required placeholder="RO-1001" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} /></Field>
          <Field label="Number plate"><input required placeholder="ABC-123" value={plate} onChange={(e) => setPlate(e.target.value)} /></Field>
          <button className="btn-primary min-h-[48px] px-6" disabled={busy}><Search size={17} /> {busy ? 'Checking…' : 'Track'}</button>
        </form>
        {error && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}

        {res && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 sm:p-8 mt-6" aria-live="polite">
            <div className="flex flex-wrap justify-between gap-2">
              <div><div className="text-xs font-mono text-ink-400">{res.orderNo}</div><h2 className="font-display text-2xl font-bold">{res.vehicle}</h2></div>
              {res.estimatedReady && <div className="text-sm text-ink-300 flex items-center gap-2"><CalendarClock size={16} className="text-brand-400" /> Estimated ready: {fmtDateTime(res.estimatedReady)}</div>}
            </div>
            <ol className="grid grid-cols-4 gap-2 mt-8">
              {res.stages.map((s, i) => (
                <li key={s.id} className="relative flex flex-col items-center text-center">
                  {i > 0 && <span className={`absolute top-4 right-1/2 w-full h-0.5 ${s.state !== 'todo' ? 'bg-brand-500' : 'bg-ink-700'}`} />}
                  <span className={`relative z-10 w-9 h-9 rounded-full grid place-items-center border-2 text-sm font-bold ${s.state === 'done' ? 'bg-brand-500 border-brand-500 text-white' : s.state === 'current' ? 'bg-ink-950 border-brand-500 text-brand-400 shadow-[0_0_24px_rgba(249,115,22,.6)]' : 'bg-ink-950 border-ink-600 text-ink-500'}`}>
                    {s.state === 'done' ? <Check size={17} /> : i + 1}
                  </span>
                  <span className={`text-[11px] sm:text-sm mt-2 ${s.state === 'current' ? 'text-white font-semibold' : 'text-ink-400'}`}>{s.label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-xl bg-brand-500/10 border border-brand-500/30 px-4 py-3 text-brand-100">{res.message}</p>
            <p className="text-xs text-ink-500 mt-3">Last updated {fmtDateTime(res.updatedAt)} · Questions? Call {BUSINESS.phone}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
