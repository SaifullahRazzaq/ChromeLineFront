import { useRef, useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'
import { api } from '../lib/api'
import type { Photo } from '../lib/types'
import { useToast } from './Toast'

export default function PhotoUploader({ jobId, kind, label, onUploaded }: { jobId: string; kind: Photo['kind']; label?: string; onUploaded: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const cam = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const send = async (files: FileList | null) => {
    if (!files?.length) return
    const f = new FormData()
    f.append('kind', kind)
    Array.from(files).forEach((x) => f.append('photos', x))
    setBusy(true)
    try { await api.upload(`/jobs/${jobId}/photos`, f); toast(`${files.length} photo(s) uploaded`); onUploaded() } catch (e) { toast((e as Error).message, 'err') } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
      if (cam.current) cam.current.value = ''
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      <input ref={cam} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => send(e.target.files)} />
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => send(e.target.files)} />
      <button className="btn-primary" disabled={busy} onClick={() => cam.current?.click()}><Camera size={17} /> {busy ? 'Uploading…' : label ?? 'Take photo'}</button>
      <button className="btn-ghost" disabled={busy} onClick={() => ref.current?.click()}><ImagePlus size={17} /> Upload</button>
    </div>
  )
}
