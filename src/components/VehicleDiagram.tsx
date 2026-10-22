import { useState } from 'react'
import clsx from 'clsx'
import { Trash2 } from 'lucide-react'
import type { Marker } from '../lib/types'

type View = Marker['view']
const VIEWS: { id: View; label: string }[] = [
  { id: 'front', label: 'Front' }, { id: 'rear', label: 'Rear' }, { id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }, { id: 'top', label: 'Top' },
]
const SEV = { minor: '#facc15', moderate: '#f97316', severe: '#ef4444' } as const

const stroke = { fill: 'none', stroke: '#8a909b', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

function Outline({ view }: { view: View }) {
  if (view === 'left' || view === 'right') {
    const flip = view === 'right' ? 'translate(300 0) scale(-1 1)' : undefined
    return (
      <g transform={flip} {...stroke}>
        <path d="M20 112 L20 88 Q22 78 46 74 L84 52 Q92 46 104 46 L186 46 Q200 46 208 54 L240 74 Q272 78 280 90 L280 112 Z" />
        <path d="M92 72 L100 52 L146 52 L146 72 Z M156 72 L156 52 L188 52 Q196 54 204 72 Z" />
        <circle cx="76" cy="114" r="20" fill="#16181b" /><circle cx="76" cy="114" r="9" />
        <circle cx="226" cy="114" r="20" fill="#16181b" /><circle cx="226" cy="114" r="9" />
        <path d="M262 84 L276 86 M24 88 L38 88" />
      </g>
    )
  }
  if (view === 'top') {
    return (
      <g {...stroke}>
        <rect x="95" y="8" width="110" height="144" rx="34" />
        <path d="M108 52 L192 52 L184 74 L116 74 Z M116 96 L184 96 L192 116 L108 116 Z" />
        <rect x="116" y="76" width="68" height="18" rx="3" />
        <rect x="82" y="30" width="14" height="30" rx="4" fill="#16181b" /><rect x="204" y="30" width="14" height="30" rx="4" fill="#16181b" />
        <rect x="82" y="100" width="14" height="30" rx="4" fill="#16181b" /><rect x="204" y="100" width="14" height="30" rx="4" fill="#16181b" />
      </g>
    )
  }
  const rear = view === 'rear'
  return (
    <g {...stroke}>
      <path d="M70 120 L70 84 Q70 70 90 66 L104 40 Q110 32 124 32 L176 32 Q190 32 196 40 L210 66 Q230 70 230 84 L230 120 Z" />
      <path d={rear ? 'M112 64 L120 42 L180 42 L188 64 Z' : 'M112 64 L120 42 L180 42 L188 64 Z'} />
      <rect x="82" y="80" width="30" height="14" rx="5" /><rect x="188" y="80" width="30" height="14" rx="5" />
      <path d={rear ? 'M122 100 L178 100 L178 112 L122 112 Z' : 'M126 98 L174 98'} />
      <rect x="64" y="112" width="26" height="30" rx="6" fill="#16181b" /><rect x="210" y="112" width="26" height="30" rx="6" fill="#16181b" />
    </g>
  )
}

export default function VehicleDiagram({ markers, onChange, readOnly }: { markers: Marker[]; onChange?: (m: Marker[]) => Promise<unknown> | void; readOnly?: boolean }) {
  const [view, setView] = useState<View>('front')
  const [sev, setSev] = useState<Marker['severity']>('minor')
  const [existing, setExisting] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const counts = (v: View) => markers.filter((m) => m.view === v).length

  const add = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onChange) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10
    const next = [...markers, { view, x, y, severity: sev, note: '', existing }]
    onChange(next)
    setSelected(next.length - 1)
  }

  const note = selected !== null ? markers[selected] : null
  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Vehicle view">
        {VIEWS.map((v) => (
          <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => { setView(v.id); setSelected(null) }}
            className={clsx('px-3 min-h-[40px] rounded-lg text-sm font-medium whitespace-nowrap', view === v.id ? 'bg-brand-500 text-white' : 'bg-ink-700 text-ink-300')}>
            {v.label}{counts(v.id) > 0 && <span className="ml-1.5 text-xs opacity-80">({counts(v.id)})</span>}
          </button>
        ))}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-400">Tap the car to mark damage:</span>
          {(Object.keys(SEV) as Marker['severity'][]).map((s) => (
            <button key={s} onClick={() => setSev(s)} className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 min-h-[36px] border text-xs capitalize', sev === s ? 'border-white text-white' : 'border-ink-600 text-ink-300')}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV[s] }} />{s}
            </button>
          ))}
          <label className="inline-flex items-center gap-2 text-xs text-ink-300 min-h-[36px]"><input type="checkbox" checked={existing} onChange={(e) => setExisting(e.target.checked)} /> Pre-existing damage</label>
        </div>
      )}

      <svg viewBox="0 0 300 160" className={clsx('w-full max-w-xl mx-auto rounded-xl bg-ink-900 border border-ink-700 select-none touch-manipulation', !readOnly && 'cursor-crosshair')} onClick={add} role="img" aria-label={`${view} view of vehicle with ${counts(view)} damage markers`}>
        <Outline view={view} />
        {markers.map((m, i) => m.view === view && (
          <g key={i} transform={`translate(${(m.x / 100) * 300} ${(m.y / 100) * 160})`} onClick={(e) => { e.stopPropagation(); setSelected(i) }} className="cursor-pointer">
            <circle r={selected === i ? 11 : 9} fill={SEV[m.severity]} fillOpacity={m.existing ? 0.35 : 0.9} stroke={m.existing ? SEV[m.severity] : '#fff'} strokeWidth="1.5" strokeDasharray={m.existing ? '3 2' : undefined} />
            <text textAnchor="middle" dy="4" fontSize="11" fontWeight="700" fill="#111">{i + 1}</text>
          </g>
        ))}
      </svg>

      {markers.length > 0 && (
        <ul className="space-y-2">
          {markers.map((m, i) => (
            <li key={i} className={clsx('rounded-lg border px-3 py-2 flex items-start gap-3', selected === i ? 'border-brand-500 bg-ink-700' : 'border-ink-700 bg-ink-900')} onClick={() => { setSelected(i); setView(m.view) }}>
              <span className="w-6 h-6 rounded-full grid place-items-center text-xs font-bold text-black shrink-0" style={{ background: SEV[m.severity] }}>{i + 1}</span>
              <div className="min-w-0 flex-1 text-sm">
                <div className="capitalize text-ink-300">{m.view} · {m.severity}{m.existing && ' · pre-existing'}</div>
                {readOnly ? <div className="text-ink-400">{m.note}</div> : selected === i ? (
                  <input autoFocus className="mt-1" placeholder="Describe the damage…" value={note?.note ?? ''}
                    onChange={(e) => onChange?.(markers.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                ) : <div className="text-ink-400 truncate">{m.note || 'Tap to add a note'}</div>}
              </div>
              {!readOnly && <button aria-label={`Remove marker ${i + 1}`} className="p-2 -m-1 text-ink-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setSelected(null); onChange?.(markers.filter((_, j) => j !== i)) }}><Trash2 size={16} /></button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
