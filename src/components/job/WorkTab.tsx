import { api } from '../../lib/api'
import { REPAIR_LABEL } from '../../lib/format'
import type { JobDetail } from '../../lib/types'
import { useAuth } from '../../auth/AuthContext'
import { CheckList, Empty, Section } from '../ui'
import TaskCard from '../TaskCard'

// Tasks, repair-specific workflows (Phase 6) and the final repair checklist
export default function WorkTab({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const locked = !(job.technician?._id === user?._id || user?.role !== 'technician') || !['in_progress', 'rework', 'paused'].includes(job.status)
  const toggle = (list: string, type?: string) => async (key: string, done: boolean) => {
    await api.patch(`/jobs/${job._id}/checklist/${list}/${key}${type ? `?type=${type}` : ''}`, { done })
    reload()
  }

  return (
    <div className="space-y-4">
      <Section title={`Tasks (${job.tasks.filter((t) => t.status === 'completed').length}/${job.tasks.length} done)`}>
        {job.tasks.length ? (
          <div className="grid lg:grid-cols-2 gap-3">{job.tasks.map((t) => <TaskCard key={t._id} task={t} onChange={reload} />)}</div>
        ) : <Empty>No tasks assigned to this job yet. Your supervisor will add them.</Empty>}
      </Section>

      {locked && <p className="text-xs text-ink-400 px-1">Checklists unlock once the repair is started.</p>}
      <div className="grid lg:grid-cols-2 gap-4">
        {job.workflows.filter((w) => w.steps.length).map((w) => (
          <Section key={w.type} title={REPAIR_LABEL[w.type] ?? w.type}>
            <CheckList items={w.steps} readOnly={locked} onToggle={toggle('workflow', w.type)} />
          </Section>
        ))}
        <Section title="Final repair checklist" className="lg:col-span-2">
          <CheckList items={job.finalChecklist} readOnly={locked} onToggle={toggle('final')} />
        </Section>
      </div>
    </div>
  )
}
