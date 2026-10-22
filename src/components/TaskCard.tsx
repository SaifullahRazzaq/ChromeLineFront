import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, Lock, Pause, Play, Repeat, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../lib/api'
import { fmtMins, REPAIR_LABEL } from '../lib/format'
import { useNow } from '../lib/hooks'
import type { Task } from '../lib/types'
import { ActionButton, Badge, Progress, PromptModal, PriorityBadge } from './ui'
import { useAuth } from '../auth/AuthContext'

const TONE: Record<Task['status'], string> = {
  todo: 'bg-ink-600 text-ink-200', in_progress: 'bg-brand-500/20 text-brand-300', paused: 'bg-yellow-500/15 text-yellow-300', blocked: 'bg-red-500/15 text-red-300',
  review: 'bg-violet-500/15 text-violet-300', completed: 'bg-emerald-500/15 text-emerald-300', rework: 'bg-red-500/15 text-red-300',
}

export default function TaskCard({ task, onChange, showJob, staffTechs }: { task: Task; onChange: () => void; showJob?: boolean; staffTechs?: { _id: string; name: string }[] }) {
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const [modal, setModal] = useState<'block' | 'reassign' | 'review' | 'assign' | null>(null)
  const live = !!task.runningSince
  const now = useNow(live ? 1000 : 60000)
  const extra = live ? Math.floor((now - new Date(task.runningSince!).getTime()) / 60000) : 0
  // server actualMins already counts the open entry as of load time; show a live estimate
  const actual = task.actualMins
  const over = actual > task.estimatedMinutes
  const done = task.status === 'completed'
  const unmet = task.dependencies.filter((d) => d.status !== 'completed')
  const job = typeof task.job === 'object' ? task.job : null
  const act = async (path: string, body?: unknown) => { await api.post(`/tasks/${task._id}/${path}`, body); onChange() }

  return (
    <div className={clsx('card p-4 space-y-3', live && 'border-brand-500/70')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {showJob && job && <Link to={`/jobs/${job._id}`} className="text-xs font-mono text-brand-400 hover:underline">{job.orderNo}</Link>}
          <div className={clsx('font-semibold text-white', done && 'line-through text-ink-400')}>{task.title}</div>
          {task.repairType && <div className="text-xs text-ink-400">{REPAIR_LABEL[task.repairType] ?? task.repairType}</div>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge tone={TONE[task.status]}>{task.status.replace('_', ' ')}</Badge>
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {task.instructions && <p className="text-sm text-ink-300 whitespace-pre-line">{task.instructions}</p>}

      {unmet.length > 0 && !done && (
        <div className="flex items-start gap-2 text-xs text-yellow-300 bg-yellow-500/10 rounded-lg px-3 py-2"><Lock size={14} className="mt-0.5 shrink-0" /> Waiting on: {unmet.map((d) => d.title).join(', ')}</div>
      )}
      {task.status === 'blocked' && <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 rounded-lg px-3 py-2"><Ban size={14} className="mt-0.5 shrink-0" /> Blocked: {task.blocked?.reason}</div>}
      {task.review && !task.review.approved && <div className="text-xs text-red-300 bg-red-500/10 rounded-lg px-3 py-2">Sent back: {task.review.note || 'rework required'}</div>}
      {task.reassignRequest?.status === 'pending' && <div className="text-xs text-sky-300 bg-sky-500/10 rounded-lg px-3 py-2">Reassignment requested: {task.reassignRequest.reason}</div>}

      <div className="flex items-center gap-3">
        <Progress value={task.completionPct} className="flex-1" />
        <span className="text-xs tabular-nums text-ink-300 w-9 text-right">{task.completionPct}%</span>
      </div>
      <div className="flex flex-wrap items-center justify-between text-xs text-ink-400 gap-2">
        <span>Est {fmtMins(task.estimatedMinutes)} · Actual <span className={clsx(over ? 'text-red-300' : 'text-ink-200', 'font-medium')}>{fmtMins(actual)}</span>{live && ` (+${extra}m live)`}</span>
        {staff && task.assignee && <span>{task.assignee.name}</span>}
      </div>

      {!done && (
        <div className="flex flex-wrap gap-2">
          {!staff || task.assignee?._id === user?._id ? (
            <>
              {live
                ? <ActionButton className="btn-ghost" onAction={() => act('stop')}><Pause size={16} /> Stop timer</ActionButton>
                : task.status !== 'blocked' && <ActionButton onAction={() => act('start')} disabled={unmet.length > 0}><Play size={16} /> Start timer</ActionButton>}
              {task.status !== 'blocked' && <ActionButton className="btn-ok" onAction={() => act('complete')} success="Task completed" disabled={unmet.length > 0}><CheckCircle2 size={16} /> Complete</ActionButton>}
              {task.status === 'blocked'
                ? <ActionButton className="btn-ghost" onAction={() => act('unblock')}>Unblock</ActionButton>
                : <button className="btn-ghost" onClick={() => setModal('block')}><Ban size={16} /> Blocked</button>}
              {task.status !== 'blocked' && (
                <input type="range" min={0} max={99} defaultValue={task.completionPct} aria-label="Task completion" className="flex-1 min-w-[120px]"
                  onPointerUp={async (e) => { await api.patch(`/tasks/${task._id}/progress`, { completionPct: Number((e.target as HTMLInputElement).value) }); onChange() }} />
              )}
              <button className="btn-ghost btn-sm" onClick={() => setModal('reassign')}><Repeat size={14} /> Ask to reassign</button>
            </>
          ) : null}
          {staff && staffTechs && <button className="btn-ghost btn-sm" onClick={() => setModal('assign')}>Reassign</button>}
        </div>
      )}
      {staff && done && <button className="btn-ghost btn-sm" onClick={() => setModal('review')}>Review work</button>}

      <PromptModal open={modal === 'block'} onClose={() => setModal(null)} title="Report blocked task" submitLabel="Report blocker" fields={[{ name: 'reason', label: 'What is blocking you?', type: 'textarea', required: true }]} onSubmit={(v) => act('block', v)} />
      <PromptModal open={modal === 'reassign'} onClose={() => setModal(null)} title="Request reassignment" submitLabel="Send request" fields={[{ name: 'reason', label: 'Why?', type: 'textarea', required: true }]} onSubmit={(v) => act('reassign-request', v)} />
      <PromptModal open={modal === 'review'} onClose={() => setModal(null)} title="Review task" submitLabel="Submit review" fields={[{ name: 'decision', label: 'Decision', type: 'select', options: ['approve', 'send back for rework'] }, { name: 'note', label: 'Note', type: 'textarea' }]}
        onSubmit={(v) => act('review', { approved: v.decision === 'approve', note: v.note })} />
      {staffTechs && (
        <PromptModal open={modal === 'assign'} onClose={() => setModal(null)} title="Reassign task" submitLabel="Reassign"
          fields={[{ name: 'name', label: 'Technician', type: 'select', options: staffTechs.map((t) => t.name) }]}
          onSubmit={(v) => act('reassign', { assignee: staffTechs.find((t) => t.name === v.name)?._id })} />
      )}
    </div>
  )
}
