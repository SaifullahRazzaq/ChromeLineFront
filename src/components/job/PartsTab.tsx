import { useState } from 'react'
import { api } from '../../lib/api'
import { fmtDateTime } from '../../lib/format'
import type { JobDetail } from '../../lib/types'
import { useAuth } from '../../auth/AuthContext'
import { Empty, PromptModal, Section } from '../ui'
import PartRequestModal from '../PartRequestModal'
import { RequestRow } from '../../pages/Parts'

export default function PartsTab({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const editable = job.technician?._id === user?._id || user?.role !== 'technician'
  const [req, setReq] = useState(false)
  const [used, setUsed] = useState(false)

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Section title="Required parts (linked to this order)">
        {job.requiredParts.length ? (
          <ul className="divide-y divide-ink-700">{job.requiredParts.map((p, i) => <li key={i} className="flex justify-between py-2 text-sm"><span>{p.name}</span><span className="text-ink-400">× {p.qty}</span></li>)}</ul>
        ) : <Empty>Parts issued from inventory will appear here automatically.</Empty>}
      </Section>

      <Section title="Parts used" action={editable && <button className="btn-ghost btn-sm" onClick={() => setUsed(true)}>Record parts used</button>}>
        {job.partsUsed.length ? (
          <ul className="divide-y divide-ink-700">{job.partsUsed.map((p) => <li key={p._id} className="flex justify-between py-2 text-sm"><span>{p.name}</span><span className="text-ink-400">× {p.qty} · {fmtDateTime(p.at)}</span></li>)}</ul>
        ) : <Empty>Nothing recorded yet.</Empty>}
      </Section>

      <Section title="Requests & reports" className="lg:col-span-2" action={editable && <button className="btn-primary btn-sm" onClick={() => setReq(true)}>Request / report part</button>}>
        {job.partRequests.length ? (
          <div className="space-y-2">{job.partRequests.map((r) => <RequestRow key={r._id} r={r} onChange={reload} />)}</div>
        ) : <Empty>No parts requests for this job.</Empty>}
      </Section>

      <PartRequestModal open={req} onClose={() => setReq(false)} jobId={job._id} onDone={reload} />
      <PromptModal open={used} onClose={() => setUsed(false)} title="Record parts used" submitLabel="Record"
        fields={[{ name: 'name', label: 'Part', required: true, placeholder: 'e.g. Trim clip kit' }, { name: 'qty', label: 'Quantity', type: 'number', required: true }]}
        onSubmit={async (v) => { await api.post(`/jobs/${job._id}/parts-used`, { name: v.name, qty: Number(v.qty) }); reload() }} />
    </div>
  )
}
