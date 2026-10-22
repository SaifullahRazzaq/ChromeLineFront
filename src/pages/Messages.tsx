import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Paperclip, Send } from 'lucide-react'
import clsx from 'clsx'
import { api, assetUrl } from '../lib/api'
import { getSocket } from '../lib/socket'
import { useLoad } from '../lib/hooks'
import { fmtDateTime } from '../lib/format'
import type { JobCard, Notice } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Empty, Loading, Tabs } from '../components/ui'
import { useToast } from '../components/Toast'

interface Msg { _id: string; channel: string; text: string; createdAt: string; sender: { _id: string; name: string; role: string }; attachments: { url: string; name: string; mime: string }[] }

const ICON: Record<string, string> = { assignment: '🛠', deadline: '⏰', parts: '📦', approval: '✅', qc: '🔍', comment: '💬', delay: '⚠️', system: 'ℹ️' }

export default function Messages() {
  const [tab, setTab] = useState<'alerts' | 'chat'>('alerts')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'alerts', label: 'Notifications' }, { id: 'chat', label: 'Team & job chat' }]} />
      {tab === 'alerts' ? <Alerts /> : <Chat />}
    </div>
  )
}

function Alerts() {
  const { data, loading, reload } = useLoad<{ items: Notice[]; unread: number }>('/notifications', ['notification'])
  const nav = useNavigate()
  if (loading || !data) return <Loading />
  const open = async (n: Notice) => {
    if (!n.read) { await api.post('/notifications/read', { ids: [n._id] }).catch(() => {}); reload() }
    if (n.link) nav(n.link)
  }
  return (
    <div className="space-y-3">
      {data.unread > 0 && <ActionButton className="btn-ghost btn-sm" onAction={async () => { await api.post('/notifications/read', {}); window.dispatchEvent(new Event('pb:notifications-read')); reload() }}>Mark all read ({data.unread})</ActionButton>}
      {data.items.length ? (
        <ul className="card divide-y divide-ink-700">
          {data.items.map((n) => (
            <li key={n._id}>
              <button onClick={() => open(n)} className="w-full text-left flex gap-3 px-4 py-3 min-h-[60px] hover:bg-ink-700/50">
                <span className="text-xl" aria-hidden>{ICON[n.type] ?? 'ℹ️'}</span>
                <span className="min-w-0 flex-1">
                  <span className={clsx('block text-sm', n.read ? 'text-ink-300' : 'text-white font-semibold')}>{n.title}</span>
                  <span className="block text-xs text-ink-400 truncate">{n.body}</span>
                  <span className="block text-[11px] text-ink-500">{fmtDateTime(n.createdAt)}</span>
                </span>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-2 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      ) : <Empty>No notifications.</Empty>}
    </div>
  )
}

function Chat() {
  const { user } = useAuth()
  const toast = useToast()
  const [channel, setChannel] = useState('team')
  const jobs = useLoad<JobCard[]>('/jobs?status=assigned,accepted,in_progress,paused,awaiting_parts,rework,ready_for_qc')
  const { data, loading, setData } = useLoad<Msg[]>(`/chat/${channel}`)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const end = useRef<HTMLDivElement>(null)
  const pick = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const s = getSocket()
    const h = (m: Msg) => m.channel === channel && setData((d) => (d && !d.some((x) => x._id === m._id) ? [...d, m] : d))
    s?.on('chat:message', h)
    return () => { s?.off('chat:message', h) }
  }, [channel, setData])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [data?.length])

  const send = async () => {
    if (!text.trim() && !files.length) return
    const f = new FormData()
    f.append('text', text)
    files.forEach((x) => f.append('files', x))
    try {
      const m = await api.upload<Msg>(`/chat/${channel}`, f)
      setData((d) => (d && !d.some((x) => x._id === m._id) ? [...d, m] : d))
      setText(''); setFiles([])
    } catch (e) { toast((e as Error).message, 'err') }
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-4">
      <div className="card p-2 flex md:flex-col gap-1 overflow-x-auto md:max-h-[60vh] md:overflow-y-auto">
        <button onClick={() => setChannel('team')} className={clsx('text-left rounded-lg px-3 min-h-[44px] text-sm whitespace-nowrap', channel === 'team' ? 'bg-brand-500/15 text-brand-400' : 'text-ink-300 hover:bg-ink-700')}># Workshop team</button>
        {jobs.data?.map((j) => (
          <button key={j._id} onClick={() => setChannel(`job:${j._id}`)} className={clsx('text-left rounded-lg px-3 min-h-[44px] text-sm whitespace-nowrap', channel === `job:${j._id}` ? 'bg-brand-500/15 text-brand-400' : 'text-ink-300 hover:bg-ink-700')}>{j.orderNo} · {j.vehicle.make}</button>
        ))}
      </div>
      <div className="card flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? <Loading /> : data?.length ? data.map((m) => {
            const mine = m.sender._id === user?._id
            return (
              <div key={m._id} className={clsx('flex', mine && 'justify-end')}>
                <div className={clsx('max-w-[85%] rounded-2xl px-3 py-2 text-sm', mine ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-ink-700 rounded-bl-sm')}>
                  {!mine && <div className="text-[11px] font-semibold text-brand-300">{m.sender.name} <span className="text-ink-400 capitalize">{m.sender.role}</span></div>}
                  {m.text && <div className="whitespace-pre-line break-words">{m.text}</div>}
                  {m.attachments.map((a) => a.mime.startsWith('image/')
                    ? <a key={a.url} href={assetUrl(a.url)} target="_blank" rel="noreferrer"><img src={assetUrl(a.url)} alt={a.name} className="mt-1 rounded-lg max-h-48" /></a>
                    : <a key={a.url} href={assetUrl(a.url)} target="_blank" rel="noreferrer" className="block mt-1 underline">📎 {a.name}</a>)}
                  <div className={clsx('text-[10px] mt-0.5', mine ? 'text-white/70' : 'text-ink-500')}>{fmtDateTime(m.createdAt)}</div>
                </div>
              </div>
            )
          }) : <Empty>No messages yet.</Empty>}
          <div ref={end} />
        </div>
        {files.length > 0 && <div className="px-4 pb-2 text-xs text-ink-400 flex flex-wrap gap-2">{files.map((f, i) => <span key={i} className="rounded bg-ink-700 px-2 py-1">{f.name}</span>)}</div>}
        <div className="border-t border-ink-700 p-3 flex gap-2">
          <input ref={pick} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          <button className="btn-ghost" aria-label="Attach files" onClick={() => pick.current?.click()}><Paperclip size={18} /></button>
          <input placeholder="Message…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} aria-label="Message" />
          <button className="btn-primary" onClick={send} aria-label="Send"><Send size={18} /></button>
        </div>
        {channel.startsWith('job:') && <Link to={`/jobs/${channel.slice(4)}`} className="text-xs text-brand-400 px-4 pb-2">Open job →</Link>}
      </div>
    </div>
  )
}
