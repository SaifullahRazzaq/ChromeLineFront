import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { api } from '../../lib/api'
import { fmtDate, fmtDateTime, REPAIR_LABEL } from '../../lib/format'
import type { JobDetail } from '../../lib/types'
import { ActionButton, Badge, Empty, Section } from '../ui'
import { EditDetails, TrackingInfo } from './EditDetails'
import { useAuth } from '../../auth/AuthContext'

const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 text-sm border-b border-ink-700/60 last:border-0"><dt className="text-ink-400 shrink-0">{k}</dt><dd className="text-right text-white break-words min-w-0">{children || '—'}</dd></div>
)

const INS_TONE = { none: 'bg-ink-600 text-ink-200', pending: 'bg-yellow-500/15 text-yellow-300', approved: 'bg-emerald-500/15 text-emerald-300', rejected: 'bg-red-500/15 text-red-300' }

export default function Overview({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const [note, setNote] = useState('')
  const v = job.vehicle

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Section title="Vehicle" action={staff && <EditDetails job={job} reload={reload} />}>
        <dl>
          <Row k="Make / model">{[v.make, v.model].filter(Boolean).join(' ')}</Row>
          <Row k="Year">{v.year}</Row>
          <Row k="VIN"><span className="font-mono text-xs">{v.vin}</span></Row>
          <Row k="Plate">{v.plate}</Row>
          <Row k="Colour">{v.color}</Row>
          <Row k="Mileage">{v.mileage?.toLocaleString()}</Row>
        </dl>
        {staff && <TrackingInfo job={job} />}
      </Section>

      <Section title="Customer">
        <dl>
          <Row k="Name">{job.customer?.name}</Row>
          <Row k="Phone">{job.customer?.phone && <a className="text-brand-400 inline-flex items-center gap-1" href={`tel:${job.customer.phone}`}><Phone size={13} />{job.customer.phone}</a>}</Row>
          <Row k="Email">{job.customer?.email}</Row>
          <Row k="Supervisor">{job.supervisor?.name}</Row>
          <Row k="Technician">{job.technician?.name}</Row>
        </dl>
      </Section>

      <Section title="Damage & instructions" className="lg:col-span-2">
        <div className="grid md:grid-cols-2 gap-4">
          <div><div className="label">Damage description</div><p className="text-sm whitespace-pre-line">{job.damageDescription || '—'}</p></div>
          <div><div className="label">Repair instructions</div><p className="text-sm whitespace-pre-line">{job.instructions || '—'}</p></div>
        </div>
        {job.repairTypes.length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{job.repairTypes.map((t) => <Badge key={t} tone="bg-ink-700 text-ink-200">{REPAIR_LABEL[t] ?? t}</Badge>)}</div>}
        {job.additionalDamage.length > 0 && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm">
            <div className="font-semibold text-red-200 mb-1">Additional damage reported</div>
            <ul className="space-y-1 text-red-100/80">{job.additionalDamage.map((d, i) => <li key={i}>[{d.severity}] {d.description} · {fmtDateTime(d.at)}</li>)}</ul>
          </div>
        )}
      </Section>

      <Section title="Estimate & insurance">
        <dl>
          <Row k="Customer-approved estimate">
            <span className="inline-flex items-center gap-2">${job.estimate.amount.toLocaleString()} <Badge tone={job.estimate.customerApproved ? 'bg-emerald-500/15 text-emerald-300' : 'bg-yellow-500/15 text-yellow-300'}>{job.estimate.customerApproved ? 'Approved' : 'Not approved'}</Badge></span>
          </Row>
          <Row k="Insurer">{job.insurance.provider}</Row>
          <Row k="Claim no.">{job.insurance.claimNo}</Row>
          <Row k="Insurance status"><Badge tone={INS_TONE[job.insurance.status]}>{job.insurance.status}</Badge></Row>
        </dl>
        {job.estimate.supplements.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="label">Supplements</div>
            {job.estimate.supplements.map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-2 rounded-lg bg-ink-900 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">{s.reason} · ${s.amount}</span>
                <span className="flex items-center gap-1 shrink-0">
                  <Badge tone={s.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : s.status === 'rejected' ? 'bg-red-500/15 text-red-300' : 'bg-yellow-500/15 text-yellow-300'}>{s.status}</Badge>
                  {staff && s.status === 'requested' && (
                    <>
                      <ActionButton className="btn-ok btn-sm" onAction={async () => { await api.post(`/jobs/${job._id}/supplement/${s._id}/decide`, { approved: true }); reload() }}>Approve</ActionButton>
                      <ActionButton className="btn-danger btn-sm" onAction={async () => { await api.post(`/jobs/${job._id}/supplement/${s._id}/decide`, { approved: false }); reload() }}>Reject</ActionButton>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Schedule">
        <dl>
          <Row k="Deadline">{fmtDateTime(job.deadline)}</Row>
          <Row k="Accepted">{fmtDateTime(job.acceptedAt)}</Row>
          <Row k="Completed">{fmtDateTime(job.completedAt)}</Row>
          <Row k="Pauses">{job.pauses.length}</Row>
          <Row k="Delays reported">{job.delays.length}</Row>
        </dl>
        {staff && job.inspectionRequests.filter((r) => !r.resolved).map((r) => (
          <div key={r._id} className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-violet-500/10 border border-violet-500/30 px-3 py-2 text-sm">
            <span className="min-w-0">Inspection requested{r.note ? `: ${r.note}` : ''}</span>
            <ActionButton className="btn-ok btn-sm" onAction={async () => { await api.post(`/jobs/${job._id}/inspection-requests/${r._id}/resolve`); reload() }}>Done</ActionButton>
          </div>
        ))}
      </Section>

      <Section title="Repair history (same VIN)">
        {job.vehicleHistory.length ? (
          <ul className="divide-y divide-ink-700">
            {job.vehicleHistory.map((h) => (
              <li key={h._id} className="py-2 text-sm"><Link to={`/jobs/${h._id}`} className="text-brand-400 font-mono">{h.orderNo}</Link> <span className="text-ink-400">· {fmtDate(h.createdAt)} · {h.status.replace(/_/g, ' ')}</span><div className="text-ink-300 truncate">{h.damageDescription}</div></li>
            ))}
          </ul>
        ) : <Empty>No previous repairs on record for this vehicle.</Empty>}
      </Section>

      <Section title="Internal notes">
        <div className="flex gap-2 mb-3">
          <input placeholder="Add an internal note (not visible to customer)" value={note} onChange={(e) => setNote(e.target.value)} />
          <ActionButton disabled={!note.trim()} onAction={async () => { await api.post(`/jobs/${job._id}/notes`, { text: note }); setNote(''); reload() }}>Add</ActionButton>
        </div>
        {job.internalNotes.length ? (
          <ul className="space-y-2">{[...job.internalNotes].reverse().map((n) => (
            <li key={n._id} className="rounded-lg bg-ink-900 px-3 py-2 text-sm"><div>{n.text}</div><div className="text-xs text-ink-500 mt-1">{n.by?.name} · {fmtDateTime(n.at)}</div></li>
          ))}</ul>
        ) : <Empty>No notes yet.</Empty>}
      </Section>
    </div>
  )
}
