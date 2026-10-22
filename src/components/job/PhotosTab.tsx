import { useState } from 'react'
import { MapPin, Trash2 } from 'lucide-react'
import { api, assetUrl } from '../../lib/api'
import type { JobDetail, Photo } from '../../lib/types'
import { useAuth } from '../../auth/AuthContext'
import { fmtDateTime } from '../../lib/format'
import { ActionButton, Empty, Modal, Section } from '../ui'
import PhotoUploader from '../PhotoUploader'

const GROUPS: { kind: Photo['kind']; title: string }[] = [
  { kind: 'before', title: 'Before' },
  { kind: 'damage', title: 'Damage' },
  { kind: 'progress', title: 'Repair progress' },
  { kind: 'after', title: 'After' },
]

export function PhotoGrid({ job, photos, reload, editable }: { job: JobDetail; photos: Photo[]; reload: () => void; editable: boolean }) {
  const [open, setOpen] = useState<Photo | null>(null)
  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((p) => (
          <li key={p._id} className="relative">
            <button className="block w-full aspect-square rounded-lg overflow-hidden bg-ink-900 border border-ink-700 hover:border-brand-500" onClick={() => setOpen(p)} aria-label={`Open ${p.kind} photo`}>
              {p.url.endsWith('.pdf') ? <span className="grid h-full place-items-center text-sm">PDF</span> : <img src={assetUrl(p.url)} alt={p.caption || `${p.kind} photo`} loading="lazy" className="w-full h-full object-cover" />}
            </button>
            {p.annotations.length > 0 && <span className="absolute top-1.5 left-1.5 rounded-full bg-brand-500 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5"><MapPin size={10} />{p.annotations.length}</span>}
          </li>
        ))}
      </ul>
      {open && <Viewer job={job} photo={open} editable={editable} onClose={() => setOpen(null)} onSaved={reload} />}
    </>
  )
}

// Full-size viewer; tap the image to drop an annotation pin
function Viewer({ job, photo, editable, onClose, onSaved }: { job: JobDetail; photo: Photo; editable: boolean; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth()
  const [pins, setPins] = useState(photo.annotations)
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [sel, setSel] = useState<number | null>(null)
  const canDelete = editable && (photo.uploadedBy?._id === user?._id || user?.role !== 'technician')
  const dirty = JSON.stringify(pins) !== JSON.stringify(photo.annotations) || caption !== (photo.caption ?? '')

  return (
    <Modal open onClose={onClose} title={`${photo.kind[0].toUpperCase()}${photo.kind.slice(1)} photo`}>
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden bg-black select-none">
          <img src={assetUrl(photo.url)} alt={caption || 'photo'} className={`w-full ${editable ? 'cursor-crosshair' : ''}`}
            onClick={(e) => {
              if (!editable) return
              const r = e.currentTarget.getBoundingClientRect()
              const next = [...pins, { x: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10, y: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10, text: '' }]
              setPins(next); setSel(next.length - 1)
            }} />
          {pins.map((a, i) => (
            <button key={i} style={{ left: `${a.x}%`, top: `${a.y}%` }} onClick={() => setSel(i)} aria-label={`Annotation ${i + 1}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full grid place-items-center text-xs font-bold border-2 border-white ${sel === i ? 'bg-brand-400 text-black' : 'bg-brand-600 text-white'}`}>{i + 1}</button>
          ))}
        </div>
        {sel !== null && pins[sel] && editable && (
          <div className="flex gap-2">
            <input autoFocus placeholder={`Note for pin ${sel + 1}`} value={pins[sel].text} onChange={(e) => setPins(pins.map((p, i) => (i === sel ? { ...p, text: e.target.value } : p)))} />
            <button className="btn-ghost" aria-label="Remove pin" onClick={() => { setPins(pins.filter((_, i) => i !== sel)); setSel(null) }}><Trash2 size={16} /></button>
          </div>
        )}
        {!editable && pins.map((a, i) => a.text && <div key={i} className="text-sm"><b>{i + 1}.</b> {a.text}</div>)}
        <input placeholder="Caption" value={caption} readOnly={!editable} onChange={(e) => setCaption(e.target.value)} />
        <div className="text-xs text-ink-500">{photo.uploadedBy?.name} · {fmtDateTime(photo.at)}</div>
        <div className="flex justify-between gap-2">
          {canDelete ? <ActionButton className="btn-danger" confirm="Delete this photo?" onAction={async () => { await api.del(`/jobs/${job._id}/photos/${photo._id}`); onSaved(); onClose() }}>Delete</ActionButton> : <span />}
          {editable && <ActionButton disabled={!dirty} success="Saved" onAction={async () => { await api.patch(`/jobs/${job._id}/photos/${photo._id}`, { caption, annotations: pins }); onSaved(); onClose() }}>Save annotations</ActionButton>}
        </div>
      </div>
    </Modal>
  )
}

export default function PhotosTab({ job, reload }: { job: JobDetail; reload: () => void }) {
  const { user } = useAuth()
  const editable = job.technician?._id === user?._id || user?.role !== 'technician'
  return (
    <div className="space-y-4">
      {GROUPS.map((g) => {
        const photos = job.photos.filter((p) => p.kind === g.kind)
        return (
          <Section key={g.kind} title={`${g.title} (${photos.length})`}>
            {editable && <div className="mb-3"><PhotoUploader jobId={job._id} kind={g.kind} label={`Add ${g.title.toLowerCase()} photo`} onUploaded={reload} /></div>}
            {photos.length ? <PhotoGrid job={job} photos={photos} reload={reload} editable={editable} /> : <Empty>No {g.title.toLowerCase()} photos yet.</Empty>}
          </Section>
        )
      })}
    </div>
  )
}
