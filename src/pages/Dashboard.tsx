import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, Clock, Flame, Timer } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../auth/AuthContext'
import { useLoad, useNow } from '../lib/hooks'
import type { Dashboard as D } from '../lib/types'
import { fmtDateTime, fmtMins, timeLeft } from '../lib/format'
import { Empty, ErrorNote, Loading, Progress, Section, Stat } from '../components/ui'
import JobCardView from '../components/JobCardView'

export default function Dashboard() {
  const { user } = useAuth()
  const { data, error, loading } = useLoad<D>('/dashboard', ['job:updated', 'job:created', 'task:updated', 'notification'])
  const nav = useNavigate()
  const now = useNow(30000)
  if (loading) return <Loading />
  if (error || !data) return <ErrorNote>{error || 'Could not load dashboard'}</ErrorNote>
  const team = data.scope === 'team'
  const c = data.counters
  const h = data.hours
  const greet = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{greet}, {user?.name.split(' ')[0]}</h1>
          <p className="text-sm text-ink-400">{team ? 'Workshop overview — all technicians' : 'Your workload for today'} · {new Date(now).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        {!team && (
          <Link to="/attendance" className={clsx('btn-ghost', h.clockedIn && !h.onBreak && 'ring-1 ring-emerald-500/50')}>
            <Clock size={16} /> {!h.clockedIn ? 'Clock in' : h.onBreak ? 'On break' : `On shift · ${fmtMins(h.todayMinutes)}`}
          </Link>
        )}
      </div>

      {data.runningTask && !team && (
        <Link to={`/jobs/${data.runningTask.job._id}`} className="card border-brand-500/60 bg-brand-500/10 p-4 flex items-center gap-3">
          <Timer className="text-brand-400 animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-brand-300 uppercase tracking-wide">Timer running · {data.runningTask.job.orderNo}</div>
            <div className="font-semibold text-white truncate">{data.runningTask.title}</div>
          </div>
          <LiveClock since={data.runningTask.since} />
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Today" value={c.today} sub="active jobs" onClick={() => nav('/jobs')} />
        <Stat label="Pending" value={c.pending} sub="awaiting start" tone="text-sky-300" onClick={() => nav('/jobs?status=assigned,accepted,awaiting_parts')} />
        <Stat label="In progress" value={c.inProgress} sub="repairs underway" tone="text-brand-400" onClick={() => nav('/jobs?status=in_progress,paused,rework')} />
        <Stat label="Completed" value={c.completed} sub="QC / delivered" tone="text-emerald-300" onClick={() => nav('/jobs?status=ready_for_qc,qc_passed,ready_for_delivery')} />
        <Stat label="Overdue" value={c.overdue} sub="past deadline" tone={c.overdue ? 'text-red-400' : 'text-white'} onClick={() => nav('/jobs?overdue=true')} />
        <Stat label="Priority" value={c.priority} sub="urgent / high" tone={c.priority ? 'text-brand-300' : 'text-white'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Section title="Today's jobs">
            {data.todayJobs.length ? (
              <div className="grid sm:grid-cols-2 gap-3">{data.todayJobs.map((j) => <JobCardView key={j._id} job={j} showTech={team} />)}</div>
            ) : <Empty>Nothing scheduled for today.</Empty>}
          </Section>

          {data.overdue.length > 0 && (
            <Section title="Overdue tasks" action={<AlertTriangle size={16} className="text-red-400" />}>
              <ul className="divide-y divide-ink-700">
                {data.overdue.map((j) => (
                  <li key={j._id}>
                    <Link to={`/jobs/${j._id}`} className="flex items-center justify-between gap-3 py-3 min-h-[48px] hover:text-white">
                      <span className="truncate"><span className="font-mono text-xs text-ink-400 mr-2">{j.orderNo}</span>{j.vehicle.make} {j.vehicle.model}</span>
                      <span className="text-xs text-red-300 whitespace-nowrap">{timeLeft(j.deadline).text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Upcoming deadlines">
            {data.upcoming.length ? (
              <ul className="divide-y divide-ink-700">
                {data.upcoming.map((j) => {
                  const t = timeLeft(j.deadline)
                  return (
                    <li key={j._id}>
                      <Link to={`/jobs/${j._id}`} className="flex items-center justify-between gap-3 py-3 min-h-[48px] hover:text-white">
                        <span className="truncate"><span className="font-mono text-xs text-ink-400 mr-2">{j.orderNo}</span>{j.vehicle.make} {j.vehicle.model}</span>
                        <span className={clsx('text-xs whitespace-nowrap', t.urgent ? 'text-brand-300 font-semibold' : 'text-ink-400')}>{fmtDateTime(j.deadline)} · {t.text}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : <Empty>No upcoming deadlines.</Empty>}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Daily workload">
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold tabular-nums text-white">{data.workload.loadPct}%</span>
              <span className="text-xs text-ink-400">{fmtMins(data.workload.plannedMinutes)} of {fmtMins(data.workload.shiftMinutes)} shift</span>
            </div>
            <Progress value={Math.min(100, data.workload.loadPct)} />
            {data.workload.loadPct > 100 && <p className="text-xs text-red-300 mt-2">Over capacity — tell your supervisor.</p>}
            <dl className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div><dt className="text-[11px] text-ink-400 uppercase">Open tasks</dt><dd className="text-lg font-semibold text-white">{data.workload.openTasks}</dd></div>
              <div><dt className="text-[11px] text-ink-400 uppercase">Due today</dt><dd className="text-lg font-semibold text-white">{data.workload.tasksDueToday}</dd></div>
              <div><dt className="text-[11px] text-ink-400 uppercase">Blocked</dt><dd className={clsx('text-lg font-semibold', data.workload.blockedTasks ? 'text-red-300' : 'text-white')}>{data.workload.blockedTasks}</dd></div>
            </dl>
          </Section>

          {!team && (
            <Section title="Working hours">
              <dl className="space-y-2 text-sm">
                <Row k="Today" v={fmtMins(h.todayMinutes)} />
                <Row k="Breaks" v={fmtMins(h.breakMinutes)} />
                <Row k="This week" v={fmtMins(h.weekMinutes)} />
                <Row k="Shift target" v={fmtMins(h.shiftMinutes)} />
              </dl>
            </Section>
          )}

          <Section title="Priority jobs" action={<Flame size={16} className="text-brand-400" />}>
            {data.priorityJobs.length ? (
              <ul className="space-y-2">
                {data.priorityJobs.map((j) => (
                  <li key={j._id}>
                    <Link to={`/jobs/${j._id}`} className="flex items-center justify-between gap-2 rounded-lg bg-ink-900 px-3 py-2.5 min-h-[44px] hover:bg-ink-700">
                      <span className="truncate text-sm">{j.orderNo} · {j.vehicle.make} {j.vehicle.model}</span>
                      <span className={clsx('text-[11px] font-bold uppercase', j.priority === 'urgent' ? 'text-red-300' : 'text-brand-300')}>{j.priority}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty>No priority jobs.</Empty>}
          </Section>

          <Section title="Recent notifications" action={<Link to="/messages" className="text-xs text-brand-400 flex items-center gap-1"><Bell size={13} /> {data.unread} unread</Link>}>
            {data.notifications.length ? (
              <ul className="space-y-3">
                {data.notifications.map((n) => (
                  <li key={n._id} className="text-sm">
                    <Link to={n.link || '/messages'} className={clsx('block', !n.read && 'text-white')}>
                      <div className="font-medium">{!n.read && <span className="inline-block w-2 h-2 rounded-full bg-brand-500 mr-2" />}{n.title}</div>
                      <div className="text-xs text-ink-400">{n.body} · {fmtDateTime(n.createdAt)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <Empty>You're all caught up.</Empty>}
          </Section>
        </div>
      </div>
    </div>
  )
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between"><dt className="text-ink-400">{k}</dt><dd className="text-white font-medium tabular-nums">{v}</dd></div>
)

export function LiveClock({ since, className = 'font-mono text-lg text-white tabular-nums' }: { since: string; className?: string }) {
  const now = useNow(1000)
  return <div className={className}>{elapsed(since, now)}</div>
}

export function elapsed(since: string, now: number) {
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}
