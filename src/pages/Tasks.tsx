import { useState } from 'react'
import { useLoad } from '../lib/hooks'
import type { Task, User } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { Empty, ErrorNote, Loading } from '../components/ui'
import TaskCard from '../components/TaskCard'
import clsx from 'clsx'

const FILTERS = [
  { id: 'open', label: 'Open', q: 'status=todo,in_progress,paused,rework' },
  { id: 'blocked', label: 'Blocked', q: 'status=blocked' },
  { id: 'done', label: 'Completed', q: 'status=completed' },
  { id: 'all', label: 'All', q: '' },
]

export default function Tasks() {
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const [f, setF] = useState(FILTERS[0])
  const [mine, setMine] = useState(!staff)
  const qs = [f.q, mine && 'mine=true'].filter(Boolean).join('&')
  const { data, error, loading, reload } = useLoad<Task[]>(`/tasks${qs ? `?${qs}` : ''}`, ['task:updated', 'job:updated'])
  const techs = useLoad<User[]>(staff ? '/admin/users?role=technician' : null)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{staff ? 'Task board' : 'My tasks'}</h1>
      <div className="flex flex-wrap gap-2 items-center">
        {FILTERS.map((x) => (
          <button key={x.id} onClick={() => setF(x)} className={clsx('rounded-full px-4 min-h-[40px] text-sm border', f.id === x.id ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300')}>{x.label}</button>
        ))}
        {staff && <label className="ml-auto flex items-center gap-2 text-sm min-h-[40px]"><input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> Only mine</label>}
      </div>
      {loading ? <Loading /> : error ? <ErrorNote>{error}</ErrorNote> : data?.length ? (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {data.map((t) => <TaskCard key={t._id} task={t} showJob onChange={reload} staffTechs={techs.data ?? undefined} />)}
        </div>
      ) : <Empty>No tasks here.</Empty>}
    </div>
  )
}
