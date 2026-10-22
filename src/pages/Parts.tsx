import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import { fmtDateTime } from '../lib/format'
import type { Part, PartRequest } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Badge, Empty, ErrorNote, Loading, Tabs } from '../components/ui'
import PartRequestModal from '../components/PartRequestModal'

const TONE: Record<PartRequest['status'], string> = {
  requested: 'bg-sky-500/15 text-sky-300', approved: 'bg-indigo-500/15 text-indigo-300', ordered: 'bg-yellow-500/15 text-yellow-300',
  issued: 'bg-emerald-500/15 text-emerald-300', rejected: 'bg-red-500/15 text-red-300',
}
const KIND: Record<PartRequest['kind'], string> = { inventory: 'Inventory', new: 'New part', damaged: 'Damaged', missing: 'Missing' }
const NEXT: Record<PartRequest['status'], PartRequest['status'][]> = {
  requested: ['approved', 'ordered', 'issued', 'rejected'], approved: ['ordered', 'issued', 'rejected'], ordered: ['issued', 'rejected'], issued: [], rejected: [],
}

export function RequestRow({ r, onChange }: { r: PartRequest; onChange: () => void }) {
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const job = typeof r.job === 'object' ? r.job : null
  return (
    <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{r.qty} × {r.name}</div>
        <div className="text-xs text-ink-400">{KIND[r.kind]}{job && <> · <Link className="text-brand-400 font-mono" to={`/jobs/${job._id}`}>{job.orderNo}</Link></>} · {r.requestedBy?.name} · {fmtDateTime(r.createdAt)}</div>
        {r.note && <div className="text-xs text-ink-300 mt-0.5">{r.note}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TONE[r.status]}>{r.status}</Badge>
        {staff && NEXT[r.status].map((s) => (
          <ActionButton key={s} className={s === 'rejected' ? 'btn-danger btn-sm' : 'btn-ghost btn-sm'} success={`Marked ${s}`} onAction={async () => { await api.post(`/parts/requests/${r._id}/status`, { status: s }); onChange() }}>{s}</ActionButton>
        ))}
      </div>
    </div>
  )
}

export default function Parts() {
  const [tab, setTab] = useState<'requests' | 'catalog'>('requests')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const reqs = useLoad<PartRequest[]>(`/parts/requests${filter === 'open' ? '?status=requested,approved,ordered' : ''}`, ['parts:updated'])
  const parts = useLoad<Part[]>(tab === 'catalog' ? `/parts?q=${encodeURIComponent(q)}` : null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Parts & inventory</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Request / report</button>
      </div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'requests', label: staff ? 'All requests' : 'My requests' }, { id: 'catalog', label: 'Check availability' }]} />

      {tab === 'requests' ? (
        <>
          <div className="flex gap-2">
            {(['open', 'all'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 min-h-[40px] text-sm border ${filter === f ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300'}`}>{f === 'open' ? 'Open' : 'All'}</button>)}
          </div>
          {reqs.loading ? <Loading /> : reqs.error ? <ErrorNote>{reqs.error}</ErrorNote> : reqs.data?.length ? (
            <div className="space-y-2">{reqs.data.map((r) => <RequestRow key={r._id} r={r} onChange={reqs.reload} />)}</div>
          ) : <Empty>No requests.</Empty>}
        </>
      ) : (
        <>
          <input placeholder="Search by name or SKU…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search parts" />
          {parts.loading ? <Loading /> : parts.data?.length ? (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-ink-400 text-left"><tr><th className="p-3">Part</th><th className="p-3">SKU</th><th className="p-3">Location</th><th className="p-3 text-right">Available</th></tr></thead>
                <tbody className="divide-y divide-ink-700">
                  {parts.data.map((p) => (
                    <tr key={p._id}><td className="p-3 text-white">{p.name}</td><td className="p-3 font-mono text-xs">{p.sku}</td><td className="p-3">{p.location}</td>
                      <td className={`p-3 text-right font-semibold ${p.available > 0 ? 'text-emerald-300' : 'text-red-300'}`}>{p.available}{p.reserved > 0 && <span className="text-ink-500 font-normal"> ({p.reserved} held)</span>}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty>No parts found.</Empty>}
        </>
      )}
      <PartRequestModal open={open} onClose={() => setOpen(false)} onDone={reqs.reload} />
    </div>
  )
}
