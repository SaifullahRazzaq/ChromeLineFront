import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import type { JobCard, User } from '../lib/types'
import { REPAIR_LABEL } from '../lib/format'
import { Empty, ErrorNote, Field, Loading, Modal, ActionButton } from '../components/ui'
import JobCardView from '../components/JobCardView'
import { useToast } from '../components/Toast'

const FILTERS: { id: string; label: string; query: string }[] = [
  { id: 'all', label: 'All', query: '' },
  { id: 'pending', label: 'Pending', query: 'status=assigned,accepted,awaiting_parts' },
  { id: 'active', label: 'In progress', query: 'status=in_progress,paused,rework' },
  { id: 'qc', label: 'QC', query: 'status=ready_for_qc' },
  { id: 'done', label: 'Completed', query: 'status=qc_passed,ready_for_delivery' },
  { id: 'overdue', label: 'Overdue', query: 'overdue=true' },
]

export default function Jobs() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const staff = user?.role !== 'technician'
  const active = FILTERS.find((f) => new URLSearchParams(f.query).toString() === params.toString()) ?? FILTERS[0]
  const qs = [active.query, q && `q=${encodeURIComponent(q)}`].filter(Boolean).join('&')
  const { data, error, loading, reload } = useLoad<JobCard[]>(`/jobs${qs ? `?${qs}` : ''}`, ['job:updated', 'job:created'])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{staff ? 'Repair jobs' : 'My assigned jobs'}</h1>
        {staff && <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={16} /> New job</button>}
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input className="pl-9" placeholder="Search order, vehicle, plate, VIN, customer…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search jobs" />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setParams(f.query ? Object.fromEntries(new URLSearchParams(f.query)) : {})}
            className={clsx('rounded-full px-4 min-h-[40px] text-sm font-medium whitespace-nowrap border', active.id === f.id ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300 hover:bg-ink-800')}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? <Loading /> : error ? <ErrorNote>{error}</ErrorNote> : data?.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{data.map((j) => <JobCardView key={j._id} job={j} showTech={staff} />)}</div>
      ) : <Empty>No jobs match.</Empty>}
      {staff && <NewJobModal open={creating} onClose={() => setCreating(false)} onCreated={reload} />}
    </div>
  )
}

function NewJobModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const toast = useToast()
  const { data: techs } = useLoad<User[]>(open ? '/admin/users?role=technician' : null)
  const [f, setF] = useState({ customer: '', phone: '', make: '', model: '', year: '', vin: '', plate: '', damage: '', instructions: '', priority: 'normal', deadline: '', technician: '', estimate: '', approved: false, types: [] as string[] })
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }))
  return (
    <Modal open={open} onClose={onClose} title="New repair order">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Customer"><input value={f.customer} onChange={(e) => set('customer', e.target.value)} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Make"><input value={f.make} onChange={(e) => set('make', e.target.value)} /></Field>
          <Field label="Model"><input value={f.model} onChange={(e) => set('model', e.target.value)} /></Field>
          <Field label="Year"><input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
          <Field label="Number plate *" hint="Customers use this to track"><input value={f.plate} onChange={(e) => set('plate', e.target.value)} /></Field>
        </div>
        <Field label="VIN"><input value={f.vin} onChange={(e) => set('vin', e.target.value)} /></Field>
        <Field label="Damage description"><textarea rows={2} value={f.damage} onChange={(e) => set('damage', e.target.value)} /></Field>
        <Field label="Repair instructions"><textarea rows={2} value={f.instructions} onChange={(e) => set('instructions', e.target.value)} /></Field>
        <div>
          <span className="label">Repair types</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(REPAIR_LABEL).map(([k, l]) => (
              <button key={k} type="button" onClick={() => set('types', f.types.includes(k) ? f.types.filter((t) => t !== k) : [...f.types, k])}
                className={clsx('rounded-full px-3 min-h-[36px] text-xs border', f.types.includes(k) ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300')}>{l}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority"><select value={f.priority} onChange={(e) => set('priority', e.target.value)}>{['low', 'normal', 'high', 'urgent'].map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Deadline"><input type="datetime-local" value={f.deadline} onChange={(e) => set('deadline', e.target.value)} /></Field>
          <Field label="Technician"><select value={f.technician} onChange={(e) => set('technician', e.target.value)}><option value="">Unassigned</option>{techs?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select></Field>
          <Field label="Estimate"><input type="number" min="0" value={f.estimate} onChange={(e) => set('estimate', e.target.value)} /></Field>
        </div>
        <label className="flex items-center gap-3 min-h-[44px]"><input type="checkbox" checked={f.approved} onChange={(e) => set('approved', e.target.checked)} /> Customer approved estimate</label>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton disabled={!f.customer || !f.make || !f.plate.trim()} success="Job created" onAction={async () => {
            await api.post('/jobs', {
              customer: { name: f.customer, phone: f.phone }, vehicle: { make: f.make, model: f.model, year: Number(f.year) || undefined, vin: f.vin, plate: f.plate },
              damageDescription: f.damage, instructions: f.instructions, priority: f.priority, deadline: f.deadline ? new Date(f.deadline).toISOString() : undefined,
              technician: f.technician || undefined, repairTypes: f.types, estimate: { amount: Number(f.estimate) || 0, customerApproved: f.approved },
            })
            onCreated(); onClose(); toast('Job created')
          }}>Create job</ActionButton>
        </div>
      </div>
    </Modal>
  )
}
