import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLoad } from '../lib/hooks'
import type { JobDetail as JD } from '../lib/types'
import { ErrorNote, Loading, Tabs } from '../components/ui'
import Header from '../components/job/Header'
import Overview from '../components/job/Overview'
import WorkTab from '../components/job/WorkTab'
import InspectionTab from '../components/job/InspectionTab'
import PhotosTab from '../components/job/PhotosTab'
import PartsTab from '../components/job/PartsTab'
import QCTab from '../components/job/QCTab'
import ActivityTab from '../components/job/ActivityTab'

type Tab = 'overview' | 'work' | 'inspection' | 'photos' | 'parts' | 'qc' | 'activity'

export default function JobDetail() {
  const { id } = useParams()
  const { data: job, error, loading, reload } = useLoad<JD>(`/jobs/${id}`, ['job:updated', 'task:updated', 'parts:updated'])
  const [tab, setTab] = useState<Tab>('overview')

  if (loading && !job) return <Loading />
  if (error || !job) return <ErrorNote>{error || 'Job not found'}</ErrorNote>

  const openTasks = job.tasks.filter((t) => t.status !== 'completed').length
  const pendingParts = job.partRequests.filter((p) => ['requested', 'approved', 'ordered'].includes(p.status)).length

  return (
    <div className="space-y-4">
      <Header job={job} reload={reload} />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'work', label: 'Work', badge: openTasks },
        { id: 'inspection', label: 'Inspection' },
        { id: 'photos', label: 'Photos', badge: job.photos.length },
        { id: 'parts', label: 'Parts', badge: pendingParts },
        { id: 'qc', label: 'Quality control' },
        { id: 'activity', label: 'Activity', badge: job.comments.length },
      ]} />
      {tab === 'overview' && <Overview job={job} reload={reload} />}
      {tab === 'work' && <WorkTab job={job} reload={reload} />}
      {tab === 'inspection' && <InspectionTab job={job} reload={reload} />}
      {tab === 'photos' && <PhotosTab job={job} reload={reload} />}
      {tab === 'parts' && <PartsTab job={job} reload={reload} />}
      {tab === 'qc' && <QCTab job={job} reload={reload} />}
      {tab === 'activity' && <ActivityTab job={job} reload={reload} />}
    </div>
  )
}
