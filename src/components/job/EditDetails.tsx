import { useEffect, useState } from 'react'
import { Check, Copy, Pencil } from 'lucide-react'
import { api } from '../../lib/api'
import type { JobDetail } from '../../lib/types'
import { ActionButton, Field, Modal } from '../ui'
import { useToast } from '../Toast'

// Staff-only: fix customer/vehicle details (the number plate drives customer tracking)
export function EditDetails({ job, reload }: { job: JobDetail; reload: () => void }) {
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ name: '', phone: '', email: '', make: '', model: '', year: '', vin: '', plate: '', color: '', mileage: '' })
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  useEffect(() => {
    if (!open) return
    setF({ name: job.customer?.name ?? '', phone: job.customer?.phone ?? '', email: job.customer?.email ?? '', make: job.vehicle.make ?? '', model: job.vehicle.model ?? '', year: String(job.vehicle.year ?? ''), vin: job.vehicle.vin ?? '', plate: job.vehicle.plate ?? '', color: job.vehicle.color ?? '', mileage: String(job.vehicle.mileage ?? '') })
  }, [open, job])
  return (
    <>
      <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}><Pencil size={14} /> Edit details</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit customer & vehicle">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customer name"><input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Phone"><input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <div className="col-span-2"><Field label="Email"><input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></Field></div>
            <Field label="Make"><input value={f.make} onChange={(e) => set('make', e.target.value)} /></Field>
            <Field label="Model"><input value={f.model} onChange={(e) => set('model', e.target.value)} /></Field>
            <Field label="Year"><input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
            <Field label="Colour"><input value={f.color} onChange={(e) => set('color', e.target.value)} /></Field>
            <Field label="Number plate *"><input value={f.plate} onChange={(e) => set('plate', e.target.value)} /></Field>
            <Field label="Mileage"><input type="number" value={f.mileage} onChange={(e) => set('mileage', e.target.value)} /></Field>
            <div className="col-span-2"><Field label="VIN"><input value={f.vin} onChange={(e) => set('vin', e.target.value)} /></Field></div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <ActionButton disabled={!f.name.trim() || !f.make.trim() || !f.plate.trim()} success="Details saved" onAction={async () => {
              await api.patch(`/jobs/${job._id}`, {
                customer: { name: f.name, phone: f.phone, email: f.email },
                vehicle: { make: f.make, model: f.model, year: Number(f.year) || undefined, vin: f.vin, plate: f.plate, color: f.color, mileage: Number(f.mileage) || undefined },
              })
              reload(); setOpen(false)
            }}>Save</ActionButton>
          </div>
        </div>
      </Modal>
    </>
  )
}

// What to give the customer so they can follow the repair on the public Track page
export function TrackingInfo({ job }: { job: JobDetail }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/track`
  const text = `Track your repair at ${link}\nOrder number: ${job.orderNo}\nNumber plate: ${job.vehicle.plate || '(add a plate first)'}`
  const missing = !job.vehicle.plate?.trim()
  return (
    <div className="mt-3 rounded-lg bg-ink-900 border border-ink-700 p-3 text-sm">
      <div className="label">Customer tracking details</div>
      {missing ? <p className="text-yellow-300">Add the number plate (Edit details) — the customer needs it to track this job.</p> : <pre className="whitespace-pre-wrap font-sans text-ink-200">{text}</pre>}
      {!missing && (
        <button className="btn-ghost btn-sm mt-2" onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); toast('Copied — send it to the customer'); setTimeout(() => setCopied(false), 2000) } catch { toast('Could not copy', 'err') } }}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      )}
    </div>
  )
}
