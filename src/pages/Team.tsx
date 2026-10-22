import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import { fmtMins, vehicleName } from '../lib/format'
import type { JobCard, User } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { Badge, Empty, Loading, Section } from '../components/ui'
import { Navigate } from 'react-router-dom'
import { useToast } from '../components/Toast'

interface Roster { user: { _id: string; name: string; specialty?: string }; clockedIn: boolean; onBreak: boolean; workedMinutes: number }
interface Report { technician: { _id: string; name: string; specialty?: string }; activeJobs: number; completedJobs: number; overdueJobs: number }

export default function Team() {
  const { user } = useAuth()
  const toast = useToast()
  const staff = user?.role !== 'technician'
  const roster = useLoad<Roster[]>(staff ? '/attendance/roster' : null)
  const report = useLoad<Report[]>(staff ? '/admin/reports/team' : null, ['job:updated'])
  const unassigned = useLoad<JobCard[]>(staff ? '/jobs?status=assigned' : null, ['job:updated', 'job:created'])
  const techs = useLoad<User[]>(staff ? '/admin/users?role=technician' : null)
  if (!staff) return <Navigate to="/dashboard" replace />

  const assign = async (jobId: string, tech: string) => {
    if (!tech) return
    try { await api.post(`/jobs/${jobId}/assign`, { technician: tech }); toast('Assigned'); unassigned.reload() } catch (e) { toast((e as Error).message, 'err') }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Team</h1>
      <Section title="On shift now">
        {!roster.data ? <Loading /> : roster.data.length ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {roster.data.map((r) => (
              <div key={r.user._id} className="rounded-lg bg-ink-900 px-4 py-3 flex items-center justify-between gap-2">
                <div><div className="text-sm font-semibold text-white">{r.user.name}</div><div className="text-xs text-ink-400">{r.user.specialty || 'Technician'}</div></div>
                <div className="text-right">
                  <Badge tone={r.clockedIn ? (r.onBreak ? 'bg-yellow-500/15 text-yellow-300' : 'bg-emerald-500/15 text-emerald-300') : 'bg-ink-600 text-ink-300'}>{r.clockedIn ? (r.onBreak ? 'On break' : 'Working') : 'Off'}</Badge>
                  <div className="text-xs text-ink-500 mt-1">{fmtMins(r.workedMinutes)} today</div>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty>No technicians.</Empty>}
      </Section>

      <Section title="Workload by technician">
        {report.data?.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-xs uppercase text-ink-400 text-left"><tr><th className="py-2">Technician</th><th className="text-right">Active</th><th className="text-right">Completed</th><th className="text-right">Overdue</th></tr></thead>
            <tbody className="divide-y divide-ink-700 tabular-nums">
              {report.data.map((r) => (
                <tr key={r.technician._id}><td className="py-3 text-white">{r.technician.name}</td><td className="text-right">{r.activeJobs}</td><td className="text-right">{r.completedJobs}</td><td className={`text-right ${r.overdueJobs ? 'text-red-300 font-semibold' : ''}`}>{r.overdueJobs}</td></tr>
              ))}
            </tbody>
          </table></div>
        ) : <Empty>No data.</Empty>}
      </Section>

      <Section title="Reassign assigned (not yet accepted) jobs">
        {unassigned.data?.length ? (
          <ul className="divide-y divide-ink-700">
            {unassigned.data.map((j) => (
              <li key={j._id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <Link to={`/jobs/${j._id}`} className="text-sm"><span className="font-mono text-xs text-ink-400 mr-2">{j.orderNo}</span>{vehicleName(j.vehicle)} <span className="text-ink-500">· {j.technician?.name ?? 'unassigned'}</span></Link>
                <select className="max-w-[200px]" value="" onChange={(e) => assign(j._id, e.target.value)} aria-label={`Assign ${j.orderNo}`}>
                  <option value="">Assign to…</option>{techs.data?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </li>
            ))}
          </ul>
        ) : <Empty>Every job has been accepted.</Empty>}
      </Section>
    </div>
  )
}
