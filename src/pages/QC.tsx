import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useLoad } from '../lib/hooks'
import { fmtDateTime, vehicleName } from '../lib/format'
import type { JobCard } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { Empty, ErrorNote, Loading, Badge, StatusBadge } from '../components/ui'

export default function QC() {
  const { user } = useAuth()
  const reviewer = !!user?.can.approveQC
  const { data, error, loading } = useLoad<JobCard[]>('/qc', ['job:updated'])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Quality control</h1>
        <p className="text-sm text-ink-400">{reviewer ? 'Repairs submitted for inspection, oldest first.' : 'Your submissions, rework and approvals.'}</p>
      </div>
      {loading ? <Loading /> : error ? <ErrorNote>{error}</ErrorNote> : data?.length ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.map((j) => (
            <Link key={j._id} to={`/jobs/${j._id}`} className="card p-4 hover:bg-ink-700/50 space-y-2">
              <div className="flex justify-between gap-2"><span className="font-mono text-xs text-ink-400">{j.orderNo}</span><StatusBadge status={j.status} /></div>
              <div className="font-semibold text-white">{vehicleName(j.vehicle)}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                <span>{j.technician?.name}</span>
                {j.qc && j.qc.round > 1 && <Badge tone="bg-yellow-500/15 text-yellow-300">Re-inspection #{j.qc.round}</Badge>}
                {j.qc?.submittedAt && <span>Submitted {fmtDateTime(j.qc.submittedAt)}</span>}
              </div>
              <div className="inline-flex items-center gap-1 text-sm text-brand-400"><ShieldCheck size={15} /> {reviewer && j.status === 'ready_for_qc' ? 'Review now' : 'Open'}</div>
            </Link>
          ))}
        </div>
      ) : <Empty>{reviewer ? 'No repairs waiting for QC.' : 'Nothing in the QC pipeline.'}</Empty>}
    </div>
  )
}
