import { useMemo, useState } from 'react'
import { Coffee, LogIn, LogOut, Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useLoad, useNow } from '../lib/hooks'
import { fmtDateTime, fmtMins, fmtTime } from '../lib/format'
import type { Attendance as A } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Badge, Empty, Loading, PromptModal, Section, Stat, Tabs } from '../components/ui'

interface Timesheet { date: string; attendance: A | null; labor: { job: { _id: string; orderNo: string }; minutes: number; tasks: { title: string; minutes: number }[] }[]; loggedMinutes: number; workedMinutes: number; unallocatedMinutes: number }
interface Weekly { days: { date: string; workedMinutes: number; overtimeMinutes: number }[]; totalMinutes: number; overtimeMinutes: number; targetMinutes: number }
interface Productivity { tasksCompleted: number; jobsCompleted: number; estimatedMinutes: number; actualMinutes: number; efficiency: number | null; onTimeJobs: number; firstTimePassRate: number | null }
interface Leave { _id: string; from: string; to: string; type: string; reason?: string; status: 'pending' | 'approved' | 'rejected'; user?: { name: string } }
interface Done { _id: string; orderNo: string; status: string; completedAt?: string; vehicle: { make: string; model: string } }

type Tab = 'today' | 'week' | 'history' | 'leave' | 'jobs'

export default function Attendance() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('today')
  const staff = user?.role !== 'technician'
  const today = useLoad<A | null>('/attendance/today')
  const now = useNow(1000)
  const a = today.data
  const live = a && !a.clockOut
  // Server minutes are as of load time; tick forward locally while the shift is live
  const loadedAt = useMemo(() => Date.now(), [a]) // eslint-disable-line react-hooks/exhaustive-deps
  const worked = a ? a.workedMinutes + (live && !a.onBreak ? Math.max(0, Math.floor((now - loadedAt) / 60000)) : 0) : 0

  const act = (p: string) => async () => { await api.post(`/attendance/${p}`); today.reload() }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Attendance & productivity</h1>

      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-ink-400">{!a ? 'Not clocked in' : a.clockOut ? 'Shift ended' : a.onBreak ? 'On break' : 'On shift'}</div>
          <div className="text-4xl font-bold text-white tabular-nums">{fmtMins(worked)}</div>
          <div className="text-xs text-ink-400">{a?.clockIn ? `In ${fmtTime(a.clockIn)}${a.clockOut ? ` · Out ${fmtTime(a.clockOut)}` : ''} · Breaks ${fmtMins(a.breakMinutes)}` : 'Clock in to start your day and run job timers'}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!a && <ActionButton className="btn-primary min-h-[52px] text-base" success="Clocked in" onAction={act('clock-in')}><LogIn size={18} /> Clock in</ActionButton>}
          {live && !a.onBreak && <ActionButton className="btn-ghost min-h-[52px]" onAction={act('break/start')}><Coffee size={18} /> Start break</ActionButton>}
          {live && a.onBreak && <ActionButton className="btn-primary min-h-[52px]" onAction={act('break/end')}><Coffee size={18} /> End break</ActionButton>}
          {live && <ActionButton className="btn-danger min-h-[52px]" confirm="Clock out? Running timers will be stopped." success="Clocked out" onAction={act('clock-out')}><LogOut size={18} /> Clock out</ActionButton>}
        </div>
      </div>

      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'today', label: 'Timesheet' }, { id: 'week', label: 'Week & productivity' }, { id: 'history', label: 'History & overtime' },
        { id: 'leave', label: 'Leave' }, { id: 'jobs', label: 'Completed jobs' },
      ]} />
      {tab === 'today' && <TimesheetTab key={String(a?.clockOut)} />}
      {tab === 'week' && <WeekTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'leave' && <LeaveTab staff={staff} />}
      {tab === 'jobs' && <JobsTab />}
    </div>
  )
}

function TimesheetTab() {
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'))
  const { data, loading } = useLoad<Timesheet>(`/attendance/timesheet?date=${date}`)
  return (
    <div className="space-y-4">
      <input type="date" value={date} max={new Date().toLocaleDateString('en-CA')} onChange={(e) => setDate(e.target.value)} className="max-w-xs" aria-label="Timesheet date" />
      {loading || !data ? <Loading /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Worked" value={fmtMins(data.workedMinutes)} />
            <Stat label="On jobs" value={fmtMins(data.loggedMinutes)} tone="text-brand-400" />
            <Stat label="Unallocated" value={fmtMins(data.unallocatedMinutes)} tone={data.unallocatedMinutes > 90 ? 'text-yellow-300' : 'text-white'} />
          </div>
          <Section title="Job-wise labor">
            {data.labor.length ? (
              <ul className="divide-y divide-ink-700">
                {data.labor.map((l) => (
                  <li key={l.job._id} className="py-3">
                    <div className="flex justify-between font-semibold text-white"><span className="font-mono">{l.job.orderNo}</span><span className="tabular-nums">{fmtMins(l.minutes)}</span></div>
                    <ul className="mt-1 text-xs text-ink-400 space-y-0.5">{l.tasks.map((t) => <li key={t.title} className="flex justify-between"><span>{t.title}</span><span>{fmtMins(t.minutes)}</span></li>)}</ul>
                  </li>
                ))}
              </ul>
            ) : <Empty>No timer entries for this day.</Empty>}
          </Section>
        </>
      )}
    </div>
  )
}

function WeekTab() {
  const week = useLoad<Weekly>('/attendance/weekly')
  const prod = useLoad<Productivity>('/attendance/productivity')
  if (!week.data || !prod.data) return <Loading />
  const w = week.data
  const max = Math.max(...w.days.map((d) => d.workedMinutes), 480)
  const p = prod.data
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="This week" value={fmtMins(w.totalMinutes)} sub={`of ${fmtMins(w.targetMinutes)} target`} />
        <Stat label="Overtime" value={fmtMins(w.overtimeMinutes)} tone={w.overtimeMinutes ? 'text-brand-400' : 'text-white'} />
        <Stat label="Efficiency" value={p.efficiency === null ? '—' : `${p.efficiency}%`} sub="estimated ÷ actual time" tone={p.efficiency && p.efficiency >= 100 ? 'text-emerald-300' : 'text-white'} />
        <Stat label="First-time QC pass" value={p.firstTimePassRate === null ? '—' : `${p.firstTimePassRate}%`} sub="last 30 days" />
      </div>
      <Section title="Weekly working hours">
        <div className="flex items-end gap-2 h-40" role="img" aria-label="Hours worked each day this week">
          {w.days.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[11px] text-ink-400 tabular-nums">{d.workedMinutes ? fmtMins(d.workedMinutes) : ''}</span>
              <div className="w-full rounded-t bg-brand-500/80" style={{ height: `${(d.workedMinutes / max) * 100}%`, minHeight: d.workedMinutes ? 4 : 0 }} />
              <span className="text-xs text-ink-400">{new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short' })}</span>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Productivity — last 30 days">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div><dt className="text-xs text-ink-400 uppercase">Jobs completed</dt><dd className="text-2xl font-bold text-white">{p.jobsCompleted}</dd></div>
          <div><dt className="text-xs text-ink-400 uppercase">Tasks completed</dt><dd className="text-2xl font-bold text-white">{p.tasksCompleted}</dd></div>
          <div><dt className="text-xs text-ink-400 uppercase">On time</dt><dd className="text-2xl font-bold text-white">{p.onTimeJobs}/{p.jobsCompleted}</dd></div>
          <div><dt className="text-xs text-ink-400 uppercase">Est vs actual</dt><dd className="text-2xl font-bold text-white">{fmtMins(p.estimatedMinutes)} / {fmtMins(p.actualMinutes)}</dd></div>
        </dl>
      </Section>
    </div>
  )
}

function HistoryTab() {
  const hist = useLoad<A[]>('/attendance/history?days=30')
  if (!hist.data) return <Loading />
  return (
    <Section title="Attendance history (30 days)">
      {hist.data.length ? (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-xs uppercase text-ink-400 text-left"><tr><th className="py-2">Date</th><th>In</th><th>Out</th><th>Breaks</th><th>Worked</th><th>Overtime</th></tr></thead>
          <tbody className="divide-y divide-ink-700 tabular-nums">
            {hist.data.map((r) => <tr key={r._id}><td className="py-2.5 text-white">{r.date}</td><td>{fmtTime(r.clockIn)}</td><td>{fmtTime(r.clockOut)}</td><td>{fmtMins(r.breakMinutes)}</td><td>{fmtMins(r.workedMinutes)}</td><td className={r.overtimeMinutes ? 'text-brand-400 font-semibold' : ''}>{r.overtimeMinutes ? fmtMins(r.overtimeMinutes) : '—'}</td></tr>)}
          </tbody>
        </table></div>
      ) : <Empty>No attendance records yet.</Empty>}
    </Section>
  )
}

function LeaveTab({ staff }: { staff: boolean }) {
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState(false)
  const leaves = useLoad<Leave[]>(`/attendance/leave${all ? '?all=true' : ''}`)
  const tone = { pending: 'bg-yellow-500/15 text-yellow-300', approved: 'bg-emerald-500/15 text-emerald-300', rejected: 'bg-red-500/15 text-red-300' }
  return (
    <Section title="Leave requests" action={<div className="flex items-center gap-3">
      {staff && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Everyone</label>}
      <button className="btn-primary btn-sm" onClick={() => setOpen(true)}><Plus size={14} /> Request leave</button></div>}>
      {leaves.data?.length ? (
        <ul className="divide-y divide-ink-700">
          {leaves.data.map((l) => (
            <li key={l._id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div><div className="text-white">{all && l.user?.name && `${l.user.name} · `}{new Date(l.from).toLocaleDateString()} – {new Date(l.to).toLocaleDateString()} <span className="text-ink-400 capitalize">({l.type})</span></div>{l.reason && <div className="text-xs text-ink-400">{l.reason}</div>}</div>
              <div className="flex items-center gap-2"><Badge tone={tone[l.status]}>{l.status}</Badge>
                {staff && l.status === 'pending' && <>
                  <ActionButton className="btn-ok btn-sm" onAction={async () => { await api.post(`/attendance/leave/${l._id}/decide`, { approved: true }); leaves.reload() }}>Approve</ActionButton>
                  <ActionButton className="btn-danger btn-sm" onAction={async () => { await api.post(`/attendance/leave/${l._id}/decide`, { approved: false }); leaves.reload() }}>Reject</ActionButton></>}
              </div>
            </li>
          ))}
        </ul>
      ) : <Empty>No leave requests.</Empty>}
      <PromptModal open={open} onClose={() => setOpen(false)} title="Request leave" submitLabel="Submit"
        fields={[{ name: 'from', label: 'From', type: 'date', required: true }, { name: 'to', label: 'To', type: 'date', required: true }, { name: 'type', label: 'Type', type: 'select', options: ['casual', 'annual', 'sick', 'unpaid'] }, { name: 'reason', label: 'Reason', type: 'textarea' }]}
        onSubmit={async (v) => { await api.post('/attendance/leave', v); leaves.reload() }} />
    </Section>
  )
}

function JobsTab() {
  const jobs = useLoad<Done[]>('/attendance/completed-jobs')
  if (!jobs.data) return <Loading />
  return (
    <Section title="Completed jobs history">
      {jobs.data.length ? (
        <ul className="divide-y divide-ink-700">{jobs.data.map((j) => (
          <li key={j._id} className="py-3 flex justify-between gap-2 text-sm"><span><span className="font-mono text-xs text-ink-400 mr-2">{j.orderNo}</span>{j.vehicle.make} {j.vehicle.model}</span><span className="text-ink-400 capitalize">{j.status.replace(/_/g, ' ')} · {fmtDateTime(j.completedAt)}</span></li>
        ))}</ul>
      ) : <Empty>No completed jobs yet.</Empty>}
    </Section>
  )
}
