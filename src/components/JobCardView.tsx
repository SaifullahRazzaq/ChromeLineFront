import { Link } from 'react-router-dom'
import { CalendarClock, ChevronRight, User } from 'lucide-react'
import clsx from 'clsx'
import type { JobCard } from '../lib/types'
import { timeLeft, vehicleName } from '../lib/format'
import { PriorityBadge, Progress, StatusBadge } from './ui'

const EDGE: Record<string, string> = { urgent: 'border-l-red-500', high: 'border-l-brand-500', normal: 'border-l-ink-500', low: 'border-l-ink-700' }

export default function JobCardView({ job, showTech }: { job: JobCard; showTech?: boolean }) {
  const t = timeLeft(job.deadline)
  const finished = job.status === 'qc_passed' || job.status === 'ready_for_delivery'
  return (
    <Link to={`/jobs/${job._id}`} className={clsx('card border-l-4 p-4 flex flex-col gap-3 hover:bg-ink-700/50 transition-colors', EDGE[job.priority])}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-ink-400 font-mono">{job.orderNo}</div>
          <div className="font-semibold text-white truncate">{vehicleName(job.vehicle) || 'Vehicle'}</div>
          <div className="text-xs text-ink-400 truncate">{job.vehicle.plate} {job.vehicle.color && `· ${job.vehicle.color}`}</div>
        </div>
        <ChevronRight className="text-ink-500 shrink-0 mt-1" size={18} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={job.status} />
        <PriorityBadge priority={job.priority} />
      </div>
      <div className="flex items-center gap-3">
        <Progress value={job.progress} className="flex-1" />
        <span className="text-xs tabular-nums text-ink-300 w-9 text-right">{job.progress}%</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={clsx('inline-flex items-center gap-1', !finished && t.overdue ? 'text-red-300 font-semibold' : !finished && t.urgent ? 'text-brand-300' : 'text-ink-400')}>
          <CalendarClock size={14} /> {finished ? 'Done' : t.text}
        </span>
        {showTech && job.technician && <span className="inline-flex items-center gap-1 text-ink-400"><User size={13} />{job.technician.name}</span>}
      </div>
    </Link>
  )
}
