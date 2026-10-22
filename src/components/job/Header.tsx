import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, ArrowLeft, CheckCheck, ChevronDown, Pause, Play, ShieldAlert, Wrench } from 'lucide-react'
import { api } from '../../lib/api'
import { fmtDateTime, timeLeft, vehicleName } from '../../lib/format'
import type { JobDetail, JobStatus } from '../../lib/types'
import { ActionButton, Modal, PriorityBadge, Progress, PromptModal, StatusBadge } from '../ui'
import { useAuth } from '../../auth/AuthContext'

const STEPS: { label: string; match: JobStatus[] }[] = [
  { label: 'Assigned', match: ['assigned'] },
  { label: 'Accepted', match: ['accepted'] },
  { label: 'Repair', match: ['in_progress', 'paused', 'awaiting_parts', 'rework'] },
  { label: 'QC', match: ['ready_for_qc'] },
  { label: 'Passed', match: ['qc_passed'] },
  { label: 'Delivery', match: ['ready_for_delivery'] },
]

export function Timeline({ status }: { status: JobStatus }) {
  const idx = STEPS.findIndex((s) => s.match.includes(status))
  return (
    <ol className="flex items-center" aria-label="Job status timeline">
      {STEPS.map((s, i) => (
        <li key={s.label} className="flex-1 flex flex-col items-center relative">
          {i > 0 && <span className={`absolute top-3 right-1/2 w-full h-0.5 ${i <= idx ? 'bg-brand-500' : 'bg-ink-700'}`} />}
          <span className={`relative z-10 w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold border-2 ${i < idx ? 'bg-brand-500 border-brand-500 text-white' : i === idx ? 'bg-ink-900 border-brand-500 text-brand-400' : 'bg-ink-900 border-ink-600 text-ink-500'}`}>{i < idx ? '✓' : i + 1}</span>
          <span className={`text-[10px] sm:text-xs mt-1 ${i === idx ? 'text-white font-semibold' : 'text-ink-500'}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}

type ModalId = 'pause' | 'delay' | 'damage' | 'supp' | 'inspect' | 'progress' | 'more' | null

const MORE: { id: Exclude<ModalId, null>; label: string; sub: string; Icon: typeof Wrench }[] = [
  { id: 'delay', label: 'Report delay', sub: 'Let your supervisor know the deadline is at risk', Icon: AlertOctagon },
  { id: 'damage', label: 'Report additional damage', sub: 'Hidden damage found during repair', Icon: ShieldAlert },
  { id: 'supp', label: 'Request estimate supplement', sub: 'Extra work needs customer / insurer approval', Icon: Wrench },
  { id: 'inspect', label: 'Request supervisor inspection', sub: 'Ask for a mid-repair check', Icon: CheckCheck },
]

export default function Header({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const [modal, setModal] = useState<ModalId>(null)
  const staff = user?.role !== 'technician'
  const mine = job.technician?._id === user?._id
  const canAct = mine || staff
  const t = timeLeft(job.deadline)
  const J = `/jobs/${job._id}`
  const post = (p: string, b?: unknown) => async () => { await api.post(`${J}/${p}`, b); reload() }
  const needsApproval = !job.estimate.customerApproved && !staff
  const canWork = ['in_progress', 'rework'].includes(job.status)

  return (
    <div className="space-y-4">
      <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-ink-400 hover:text-white"><ArrowLeft size={15} /> Jobs</Link>
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-mono text-ink-400">{job.orderNo}</div>
            <h1 className="text-xl sm:text-2xl font-bold">{vehicleName(job.vehicle)}</h1>
            <div className="text-sm text-ink-400">{[job.vehicle.plate, job.vehicle.color, job.customer?.name].filter(Boolean).join(' · ')}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            <StatusBadge status={job.status} /><PriorityBadge priority={job.priority} />
            <span className={`text-xs font-medium ${t.overdue ? 'text-red-300' : t.urgent ? 'text-brand-300' : 'text-ink-400'}`}>{fmtDateTime(job.deadline)} · {t.text}</span>
          </div>
        </div>
        <Timeline status={job.status} />
        <div className="flex items-center gap-3">
          <Progress value={job.progress} className="flex-1" /><span className="text-sm tabular-nums text-white w-10 text-right">{job.progress}%</span>
        </div>

        {job.status === 'rework' && job.qc.feedback && (
          <div className="flex gap-2 rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 text-sm px-4 py-3"><ShieldAlert size={18} className="shrink-0 mt-0.5" /><div><b>QC failed:</b> {job.qc.feedback}</div></div>
        )}
        {needsApproval && ['accepted', 'assigned'].includes(job.status) && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/40 text-yellow-200 text-sm px-4 py-3">Waiting for customer estimate approval — you can accept the job but not start repairs yet.</div>
        )}

        {canAct && (
          <div className="flex flex-wrap gap-2">
            {job.status === 'assigned' && <ActionButton className="btn-primary flex-1 sm:flex-none" onAction={post('accept')} success="Job accepted"><CheckCheck size={18} /> Accept job</ActionButton>}
            {['accepted', 'awaiting_parts', 'rework'].includes(job.status) && (
              <ActionButton className="btn-primary flex-1 sm:flex-none min-h-[52px] text-base" disabled={needsApproval} onAction={post('start')} success="Repair started">
                <Play size={18} /> {job.status === 'rework' ? 'Start rework' : job.status === 'awaiting_parts' ? 'Parts arrived — start' : 'Start repair'}
              </ActionButton>
            )}
            {job.status === 'in_progress' && <button className="btn-ghost flex-1 sm:flex-none min-h-[52px] text-base" onClick={() => setModal('pause')}><Pause size={18} /> Pause</button>}
            {job.status === 'paused' && <ActionButton className="btn-primary flex-1 sm:flex-none min-h-[52px] text-base" onAction={post('resume')} success="Repair resumed"><Play size={18} /> Resume</ActionButton>}
            {canWork && !job.completedAt && <button className="btn-ghost" onClick={() => setModal('progress')}><Wrench size={16} /> Update progress</button>}
            {canWork && !job.completedAt && (
              <ActionButton className="btn-ok flex-1 sm:flex-none" onAction={post('complete-work')} success="Work marked complete — submit it to QC">
                <CheckCheck size={18} /> Complete assigned work
              </ActionButton>
            )}
            <button className="btn-ghost ml-auto" onClick={() => setModal('more')} aria-haspopup="dialog">Report / request <ChevronDown size={14} /></button>
          </div>
        )}
      </div>

      <Modal open={modal === 'more'} onClose={() => setModal(null)} title="Report or request">
        <div className="space-y-2">
          {MORE.map(({ id, label, sub, Icon }) => (
            <button key={id} className="w-full text-left card p-3 flex items-center gap-3 hover:bg-ink-700 min-h-[56px]" onClick={() => setModal(id)}>
              <Icon size={20} className="text-brand-400 shrink-0" />
              <span><span className="block text-sm font-semibold text-white">{label}</span><span className="text-xs text-ink-400">{sub}</span></span>
            </button>
          ))}
        </div>
      </Modal>

      <PromptModal open={modal === 'pause'} onClose={() => setModal(null)} title="Pause repair" submitLabel="Pause"
        fields={[{ name: 'kind', label: 'Reason type', type: 'select', options: ['Other', 'Waiting for parts'] }, { name: 'reason', label: 'Reason', type: 'textarea', required: true }]}
        onSubmit={async (v) => { await api.post(`${J}/pause`, { reason: v.reason, awaitingParts: v.kind === 'Waiting for parts' }); reload() }} />
      <PromptModal open={modal === 'delay'} onClose={() => setModal(null)} title="Report delay" submitLabel="Report"
        fields={[{ name: 'reason', label: 'What is causing the delay?', type: 'textarea', required: true }, { name: 'newDeadline', label: 'Suggested new deadline', type: 'date' }]}
        onSubmit={async (v) => { await api.post(`${J}/delay`, { reason: v.reason, newDeadline: v.newDeadline || undefined }); reload() }} />
      <PromptModal open={modal === 'damage'} onClose={() => setModal(null)} title="Report additional damage" submitLabel="Report"
        fields={[{ name: 'description', label: 'Describe the damage', type: 'textarea', required: true }, { name: 'severity', label: 'Severity', type: 'select', options: ['minor', 'moderate', 'severe'] }]}
        onSubmit={async (v) => { await api.post(`${J}/additional-damage`, v); reload() }} />
      <PromptModal open={modal === 'supp'} onClose={() => setModal(null)} title="Request estimate supplement" submitLabel="Send request"
        fields={[{ name: 'reason', label: 'Extra work required', type: 'textarea', required: true }, { name: 'amount', label: 'Estimated extra cost', type: 'number', required: true }]}
        onSubmit={async (v) => { await api.post(`${J}/supplement`, v); reload() }} />
      <PromptModal open={modal === 'inspect'} onClose={() => setModal(null)} title="Request supervisor inspection" submitLabel="Request"
        fields={[{ name: 'note', label: 'What should the supervisor look at?', type: 'textarea' }]}
        onSubmit={async (v) => { await api.post(`${J}/request-inspection`, v); reload() }} />
      <ProgressModal open={modal === 'progress'} onClose={() => setModal(null)} job={job} onSaved={reload} />
    </div>
  )
}

function ProgressModal({ open, onClose, job, onSaved }: { open: boolean; onClose: () => void; job: JobDetail; onSaved: () => void }) {
  const [v, setV] = useState(job.progress)
  const [note, setNote] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Update repair progress">
      <div className="space-y-4">
        {job.tasks.length > 0 && <p className="text-xs text-ink-400">Progress also updates automatically as tasks are completed.</p>}
        <div className="text-center text-4xl font-bold text-white tabular-nums">{v}%</div>
        <input type="range" min={0} max={100} step={5} value={v} onChange={(e) => setV(Number(e.target.value))} aria-label="Progress" />
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton success="Progress updated" onAction={async () => { await api.patch(`/jobs/${job._id}/progress`, { progress: v, note }); onSaved(); onClose() }}>Save</ActionButton>
        </div>
      </div>
    </Modal>
  )
}
