import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { api } from '../../lib/api'
import { getSocket } from '../../lib/socket'
import { fmtDateTime } from '../../lib/format'
import type { JobDetail } from '../../lib/types'
import { ActionButton, Empty, Section } from '../ui'
import { useAuth } from '../../auth/AuthContext'

export default function ActivityTab({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const s = getSocket()
    const h = (p: { jobId: string }) => p.jobId === job._id && reload()
    s?.on('job:comment', h)
    return () => { s?.off('job:comment', h) }
  }, [job._id, reload])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [job.comments.length])

  const send = async () => {
    if (!text.trim()) return
    await api.post(`/jobs/${job._id}/comments`, { text })
    setText('')
    reload()
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Section title="Job comments">
        <div className="max-h-96 overflow-y-auto space-y-2 mb-3 pr-1">
          {job.comments.length ? job.comments.map((c) => {
            const mine = c.by?._id === user?._id
            return (
              <div key={c._id} className={`flex ${mine ? 'justify-end' : ''}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-ink-700 rounded-bl-sm'}`}>
                  {!mine && <div className="text-[11px] font-semibold text-brand-300">{c.by?.name} <span className="text-ink-400 capitalize">{c.by?.role}</span></div>}
                  <div className="whitespace-pre-line">{c.text}</div>
                  <div className={`text-[10px] mt-0.5 ${mine ? 'text-white/70' : 'text-ink-500'}`}>{fmtDateTime(c.at)}</div>
                </div>
              </div>
            )
          }) : <Empty>No comments yet — start the conversation.</Empty>}
          <div ref={end} />
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault() }}>
          <input placeholder="Write a comment…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send().catch(() => {})} aria-label="Comment" />
          <ActionButton disabled={!text.trim()} onAction={send} aria-label="Send comment"><Send size={16} /></ActionButton>
        </form>
      </Section>

      <Section title="Activity log">
        <ol className="relative border-l border-ink-700 ml-2 space-y-4 max-h-[28rem] overflow-y-auto pr-1">
          {[...job.history].reverse().map((h, i) => (
            <li key={i} className="pl-4 relative">
              <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500" />
              <div className="text-sm text-white">{h.text}</div>
              <div className="text-xs text-ink-500">{h.by?.name} · {fmtDateTime(h.at)}</div>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  )
}
