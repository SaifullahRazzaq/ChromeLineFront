import { useState } from 'react'
import { CheckCircle2, Plus, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { fmtDateTime } from '../../lib/format'
import type { JobDetail } from '../../lib/types'
import { useAuth } from '../../auth/AuthContext'
import { ActionButton, CheckList, Empty, Field, Section } from '../ui'
import { PhotoGrid } from './PhotosTab'
import PhotoUploader from '../PhotoUploader'

export default function QCTab({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const isTech = job.technician?._id === user?._id
  const reviewer = !!user?.can.approveQC && !isTech
  const staff = user?.role !== 'technician'
  const [feedback, setFeedback] = useState('')
  const [rework, setRework] = useState<string[]>([])
  const Q = `/qc/${job._id}`
  const after = job.photos.filter((p) => p.kind === 'after' || p.kind === 'qc')
  const canSubmit = (isTech || staff) && ['in_progress', 'rework'].includes(job.status)

  return (
    <div className="space-y-4">
      {job.qc.lastResult === 'failed' && job.qc.feedback && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/40 text-red-200 text-sm px-4 py-3 flex gap-2"><XCircle size={18} className="shrink-0 mt-0.5" /><div><b>Failed inspection (round {job.qc.round}):</b> {job.qc.feedback}</div></div>
      )}
      {job.status === 'qc_passed' && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 text-sm px-4 py-3 flex gap-2"><CheckCircle2 size={18} /> QC passed — waiting for final sign-off.</div>}
      {job.status === 'ready_for_delivery' && <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm px-4 py-3 flex gap-2"><ShieldCheck size={18} /> Signed off {fmtDateTime(job.qc.signedOffAt)} — vehicle is ready for delivery.</div>}
      {job.status === 'ready_for_qc' && !reviewer && <div className="rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-200 text-sm px-4 py-3">Submitted for QC (round {job.qc.round}). You'll be notified of the result.</div>}

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Self-inspection checklist">
          <CheckList items={job.qc.selfChecklist} readOnly={!canSubmit} onToggle={async (key, done) => { await api.patch(`/jobs/${job._id}/checklist/qc/${key}`, { done }); reload() }} />
        </Section>
        <Section title="Photo evidence (after photos)">
          {canSubmit && <div className="mb-3"><PhotoUploader jobId={job._id} kind="after" label="Take after photo" onUploaded={reload} /></div>}
          {after.length ? <PhotoGrid job={job} photos={after} reload={reload} editable={canSubmit} /> : <Empty>Upload at least one after photo before submitting.</Empty>}
        </Section>
      </div>

      {canSubmit && (
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink-300">{job.completedAt ? 'Ready to submit for supervisor quality inspection.' : 'Mark your assigned work as complete first (button at the top).'}</div>
          <ActionButton className="btn-primary min-h-[52px]" disabled={!job.completedAt} success="Submitted for QC" onAction={async () => { await api.post(`${Q}/submit`); reload() }}>
            <ShieldCheck size={18} /> {job.qc.round > 0 ? 'Submit for re-inspection' : 'Submit to quality control'}
          </ActionButton>
        </div>
      )}

      {job.status === 'ready_for_qc' && reviewer && (
        <Section title="Supervisor review">
          <div className="space-y-3">
            <Field label="Feedback (required if failing)"><textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} /></Field>
            <div>
              <div className="flex items-center justify-between"><span className="label">Rework tasks (created on fail)</span><button className="btn-ghost btn-sm" onClick={() => setRework([...rework, ''])}><Plus size={14} /> Add</button></div>
              <div className="space-y-2">{rework.map((t, i) => (
                <div key={i} className="flex gap-2"><input placeholder="e.g. Re-polish rear door" value={t} onChange={(e) => setRework(rework.map((x, j) => (j === i ? e.target.value : x)))} /><button className="btn-ghost" aria-label="Remove" onClick={() => setRework(rework.filter((_, j) => j !== i))}><Trash2 size={16} /></button></div>
              ))}</div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <ActionButton className="btn-danger" success="Failed — rework assigned" disabled={!feedback.trim() && !rework.some((r) => r.trim())}
                onAction={async () => { await api.post(`${Q}/review`, { passed: false, feedback, reworkTasks: rework.filter((r) => r.trim()).map((title) => ({ title })) }); reload() }}><XCircle size={16} /> Fail & assign rework</ActionButton>
              <ActionButton className="btn-ok" success="QC passed" onAction={async () => { await api.post(`${Q}/review`, { passed: true, feedback }); reload() }}><CheckCircle2 size={16} /> Pass</ActionButton>
            </div>
          </div>
        </Section>
      )}

      {job.status === 'qc_passed' && reviewer && (
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-ink-300">Final repair sign-off marks the vehicle ready for delivery.</div>
          <ActionButton className="btn-ok min-h-[52px]" success="Signed off" confirm="Sign off this repair and mark it ready for delivery?" onAction={async () => { await api.post(`${Q}/signoff`); reload() }}><ShieldCheck size={18} /> Final sign-off</ActionButton>
        </div>
      )}
    </div>
  )
}
