import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import type { JobCard, Part, PartRequest } from '../lib/types'
import { ActionButton, Field, Modal } from './ui'
import clsx from 'clsx'

const KINDS: { id: PartRequest['kind']; label: string }[] = [
  { id: 'inventory', label: 'From inventory' },
  { id: 'new', label: 'New part' },
  { id: 'damaged', label: 'Damaged part' },
  { id: 'missing', label: 'Missing part' },
]

export default function PartRequestModal({ open, onClose, jobId, onDone }: { open: boolean; onClose: () => void; jobId?: string; onDone: () => void }) {
  const [kind, setKind] = useState<PartRequest['kind']>('inventory')
  const [job, setJob] = useState(jobId ?? '')
  const [partId, setPartId] = useState('')
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [note, setNote] = useState('')
  const [q, setQ] = useState('')
  const { data: parts } = useLoad<Part[]>(open && kind === 'inventory' ? `/parts?q=${encodeURIComponent(q)}` : null)
  const { data: jobs } = useLoad<JobCard[]>(open && !jobId ? '/jobs?status=accepted,in_progress,paused,awaiting_parts,rework,assigned' : null)

  useEffect(() => { if (open) { setKind('inventory'); setPartId(''); setName(''); setQty('1'); setNote(''); setQ(''); setJob(jobId ?? '') } }, [open, jobId])

  const chosen = parts?.find((p) => p._id === partId)
  const ready = (jobId || job) && (kind === 'inventory' ? partId : name.trim()) && Number(qty) >= 1

  return (
    <Modal open={open} onClose={onClose} title="Request / report parts">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => (
            <button key={k.id} onClick={() => setKind(k.id)} className={clsx('rounded-lg px-3 min-h-[44px] text-sm font-medium border', kind === k.id ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300')}>{k.label}</button>
          ))}
        </div>
        {!jobId && (
          <Field label="Repair order">
            <select value={job} onChange={(e) => setJob(e.target.value)}><option value="">Select job…</option>{jobs?.map((j) => <option key={j._id} value={j._id}>{j.orderNo} · {j.vehicle.make} {j.vehicle.model}</option>)}</select>
          </Field>
        )}
        {kind === 'inventory' ? (
          <>
            <input placeholder="Search parts by name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parts" />
            <ul className="max-h-48 overflow-y-auto space-y-1">
              {parts?.map((p) => (
                <li key={p._id}>
                  <button onClick={() => setPartId(p._id)} className={clsx('w-full text-left rounded-lg px-3 py-2 min-h-[44px] border flex justify-between gap-2', partId === p._id ? 'border-brand-500 bg-brand-500/10' : 'border-ink-700 bg-ink-900')}>
                    <span className="text-sm"><span className="block text-white">{p.name}</span><span className="text-xs text-ink-500">{p.sku} · {p.location}</span></span>
                    <span className={clsx('text-xs self-center whitespace-nowrap', p.available > 0 ? 'text-emerald-300' : 'text-red-300')}>{p.available > 0 ? `${p.available} available` : 'Out of stock'}</span>
                  </button>
                </li>
              ))}
            </ul>
            {chosen && chosen.available < Number(qty) && <p className="text-xs text-yellow-300">Only {chosen.available} available — the supervisor will order the rest.</p>}
          </>
        ) : (
          <Field label="Part name / number"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Quantity"><input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <div className="col-span-2"><Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field></div>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton disabled={!ready} success="Request sent" onAction={async () => {
            await api.post('/parts/requests', { job: jobId || job, kind, part: kind === 'inventory' ? partId : undefined, name: kind === 'inventory' ? undefined : name, qty: Number(qty), note })
            onDone(); onClose()
          }}>Send</ActionButton>
        </div>
      </div>
    </Modal>
  )
}
