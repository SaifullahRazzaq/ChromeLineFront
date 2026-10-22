import { useEffect, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { api } from '../../lib/api'
import type { JobDetail, Marker } from '../../lib/types'
import { useAuth } from '../../auth/AuthContext'
import { fmtDateTime } from '../../lib/format'
import { ActionButton, CheckList, Empty, PromptModal, Section } from '../ui'
import VehicleDiagram from '../VehicleDiagram'
import PhotoUploader from '../PhotoUploader'
import { PhotoGrid } from './PhotosTab'

export default function InspectionTab({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const editable = job.technician?._id === user?._id || user?.role !== 'technician'
  const J = `/jobs/${job._id}`
  const [markers, setMarkers] = useState<Marker[]>(job.inspection.damageMarkers)
  const [notes, setNotes] = useState(job.inspection.notes)
  const [issue, setIssue] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => { setMarkers(job.inspection.damageMarkers) }, [job.inspection.damageMarkers])

  // Diagram edits save after a short pause so typing a note doesn't spam the API
  const onMarkers = (m: Marker[]) => {
    setMarkers(m)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { api.put(`${J}/inspection`, { damageMarkers: m }).catch(() => {}) }, 600)
  }

  const before = job.photos.filter((p) => p.kind === 'before' || p.kind === 'damage' || p.kind === 'inspection')
  const pending = job.inspection.checklist.filter((c) => !c.done).length
  const missing = [
    pending && `${pending} checklist item(s)`,
    !job.photos.some((p) => p.kind === 'before') && 'a before photo',
    !notes.trim() && 'inspection notes',
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      {job.inspection.completed ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm px-4 py-3"><CheckCircle2 size={18} /> Check-in inspection completed {fmtDateTime(job.inspection.completedAt)}</div>
      ) : missing.length > 0 && editable && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm px-4 py-3">Required to complete inspection: {missing.join(', ')}.</div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Interactive damage diagram" className="lg:col-span-2">
          <VehicleDiagram markers={markers} onChange={editable ? onMarkers : undefined} readOnly={!editable} />
        </Section>

        <Section title="Check-in checklist">
          <CheckList items={job.inspection.checklist} readOnly={!editable}
            onToggle={async (key, done) => { await api.patch(`${J}/checklist/inspection/${key}`, { done }); reload() }} />
        </Section>

        <Section title="Inspection notes *">
          <textarea rows={6} value={notes} readOnly={!editable} placeholder="Existing damage, fluid leaks, missing items, customer remarks…" onChange={(e) => setNotes(e.target.value)} />
          {editable && <div className="mt-3"><ActionButton className="btn-ghost" success="Notes saved" onAction={async () => { await api.put(`${J}/inspection`, { notes }); reload() }}>Save notes</ActionButton></div>}
        </Section>

        <Section title="Before & damage photos *" className="lg:col-span-2">
          {editable && (
            <div className="space-y-3 mb-4">
              <div><div className="label">Before photos</div><PhotoUploader jobId={job._id} kind="before" onUploaded={reload} /></div>
              <div><div className="label">Damage images</div><PhotoUploader jobId={job._id} kind="damage" label="Photograph damage" onUploaded={reload} /></div>
            </div>
          )}
          {before.length ? <PhotoGrid job={job} photos={before} reload={reload} editable={editable} /> : <Empty>No inspection photos yet.</Empty>}
        </Section>

        <Section title="Parts & equipment issues" action={editable && <button className="btn-ghost btn-sm" onClick={() => setIssue(true)}>Report issue</button>}>
          {job.inspection.equipmentIssues.length ? (
            <ul className="space-y-2">{job.inspection.equipmentIssues.map((e, i) => <li key={i} className="rounded-lg bg-ink-900 px-3 py-2 text-sm">{e.description}<div className="text-xs text-ink-500">{fmtDateTime(e.at)}</div></li>)}</ul>
          ) : <Empty>No issues recorded.</Empty>}
        </Section>

        {editable && !job.inspection.completed && (
          <div className="lg:col-span-2 flex justify-end">
            <ActionButton className="btn-primary min-h-[52px]" success="Inspection completed"
              onAction={async () => { await api.put(`${J}/inspection`, { notes, damageMarkers: markers }); await api.post(`${J}/inspection/complete`); reload() }}>
              <CheckCircle2 size={18} /> Complete check-in inspection
            </ActionButton>
          </div>
        )}
      </div>

      <PromptModal open={issue} onClose={() => setIssue(false)} title="Report parts / equipment issue" submitLabel="Report"
        fields={[{ name: 'description', label: 'What is wrong?', type: 'textarea', required: true }]}
        onSubmit={async (v) => { await api.post(`${J}/inspection/equipment-issue`, v); reload() }} />
    </div>
  )
}
