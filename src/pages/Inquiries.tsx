import { Navigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import { fmtDateTime } from '../lib/format'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Badge, Empty, ErrorNote, Loading } from '../components/ui'

interface Inquiry { _id: string; name: string; email: string; phone: string; service: string; vehicle: string; message: string; status: 'new' | 'contacted' | 'closed'; createdAt: string }
const TONE = { new: 'bg-brand-500/20 text-brand-300', contacted: 'bg-sky-500/15 text-sky-300', closed: 'bg-ink-600 text-ink-300' }

export default function Inquiries() {
  const { user } = useAuth()
  const { data, error, loading, reload } = useLoad<Inquiry[]>(user?.role === 'technician' ? null : '/contact', ['notification'])
  if (user?.role === 'technician') return <Navigate to="/dashboard" replace />
  const set = (id: string, status: string) => async () => { await api.patch(`/contact/${id}`, { status }); reload() }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Website inquiries</h1>
      {loading ? <Loading /> : error ? <ErrorNote>{error}</ErrorNote> : data?.length ? (
        <div className="space-y-3">
          {data.map((i) => (
            <div key={i._id} className="card p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-white">{i.name} <span className="text-ink-400 font-normal text-sm">· {i.service}</span></div>
                <Badge tone={TONE[i.status]}>{i.status}</Badge>
              </div>
              <p className="text-sm whitespace-pre-line">{i.message}</p>
              <div className="text-xs text-ink-400 flex flex-wrap gap-x-4 gap-y-1">
                <a className="text-brand-400" href={`tel:${i.phone}`}>{i.phone}</a><a className="text-brand-400" href={`mailto:${i.email}`}>{i.email}</a>
                {i.vehicle && <span>{i.vehicle}</span>}<span>{fmtDateTime(i.createdAt)}</span>
              </div>
              <div className="flex gap-2">
                {i.status === 'new' && <ActionButton className="btn-ghost btn-sm" onAction={set(i._id, 'contacted')}>Mark contacted</ActionButton>}
                {i.status !== 'closed' && <ActionButton className="btn-ghost btn-sm" onAction={set(i._id, 'closed')}>Close</ActionButton>}
                {i.status === 'closed' && <ActionButton className="btn-ghost btn-sm" onAction={set(i._id, 'new')}>Reopen</ActionButton>}
              </div>
            </div>
          ))}
        </div>
      ) : <Empty>No inquiries yet.</Empty>}
    </div>
  )
}
