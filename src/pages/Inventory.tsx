import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertTriangle, ArrowDownToLine, History, Package, Pencil, Plus, Search } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import { fmtDateTime } from '../lib/format'
import type { Part } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Badge, Empty, ErrorNote, Field, Loading, Modal, Stat } from '../components/ui'

interface Summary { items: number; lowStock: number; outOfStock: number; stockValue: number | null }
interface Movement { _id: string; type: 'initial' | 'receive' | 'issue' | 'correction'; delta: number; balanceAfter: number; note: string; createdAt: string; by?: { name: string }; job?: { orderNo: string } }

const CATEGORIES = ['body', 'paint', 'lighting', 'glass', 'mechanical', 'electrical', 'consumable', 'hardware', 'general']
const blank = { sku: '', name: '', category: 'general', stock: '0', reorderLevel: '5', unitCost: '0', supplier: '', location: '', description: '' }

export default function Inventory() {
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [low, setLow] = useState(false)
  const [archived, setArchived] = useState(false)
  const qs = ['all=true', q && `q=${encodeURIComponent(q)}`, category && `category=${category}`, low && 'low=true'].filter(Boolean).join('&')
  const parts = useLoad<Part[]>(staff ? `/parts?${qs}` : null, ['parts:updated'])
  const summary = useLoad<Summary>(staff ? '/parts/inventory/summary' : null, ['parts:updated'])
  const [edit, setEdit] = useState<Part | 'new' | null>(null)
  const [adjust, setAdjust] = useState<Part | null>(null)
  const [history, setHistory] = useState<Part | null>(null)

  if (!staff) return <Navigate to="/dashboard" replace />
  const reload = () => { parts.reload(); summary.reload() }
  const list = (parts.data ?? []).filter((p) => archived || p.active)
  const s = summary.data

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Inventory</h1><p className="text-sm text-ink-400">Parts, stock levels and every stock movement.</p></div>
        <button className="btn-primary" onClick={() => setEdit('new')}><Plus size={16} /> Add part</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Parts" value={s?.items ?? '—'} />
        <Stat label="Low stock" value={s?.lowStock ?? '—'} tone={s?.lowStock ? 'text-yellow-300' : 'text-white'} onClick={() => setLow(!low)} sub={low ? 'Filtering — click to clear' : 'Click to filter'} />
        <Stat label="Out of stock" value={s?.outOfStock ?? '—'} tone={s?.outOfStock ? 'text-red-300' : 'text-white'} />
        {s?.stockValue != null && <Stat label="Stock value" value={`$${s.stockValue.toLocaleString()}`} tone="text-emerald-300" />}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input className="pl-9" placeholder="Search name, SKU, supplier…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search inventory" /></div>
        <select className="w-44" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <label className="flex items-center gap-2 text-sm min-h-[44px]"><input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low stock only</label>
        <label className="flex items-center gap-2 text-sm min-h-[44px]"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} /> Show archived</label>
      </div>

      {parts.loading ? <Loading /> : parts.error ? <ErrorNote>{parts.error}</ErrorNote> : list.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="text-xs uppercase text-ink-400 text-left"><tr><th className="p-3">Part</th><th className="p-3">Category</th><th className="p-3">Location</th><th className="p-3">Supplier</th><th className="p-3 text-right">In stock</th><th className="p-3 text-right">Available</th><th className="p-3 text-right">Cost</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-ink-700">
              {list.map((p) => (
                <tr key={p._id} className={clsx(!p.active && 'opacity-50')}>
                  <td className="p-3"><div className="text-white font-medium">{p.name}{!p.active && <Badge tone="bg-ink-600 text-ink-300"> archived</Badge>}</div><div className="font-mono text-xs text-ink-500">{p.sku}</div></td>
                  <td className="p-3 capitalize">{p.category}</td>
                  <td className="p-3">{p.location || '—'}</td>
                  <td className="p-3">{p.supplier || '—'}</td>
                  <td className="p-3 text-right tabular-nums">{p.stock}{p.reserved > 0 && <span className="text-ink-500"> ({p.reserved} held)</span>}</td>
                  <td className="p-3 text-right tabular-nums">
                    <span className={clsx('font-semibold', p.available === 0 ? 'text-red-300' : p.lowStock ? 'text-yellow-300' : 'text-emerald-300')}>{p.available}</span>
                    {p.lowStock && <span title={`Reorder at ${p.reorderLevel}`}><AlertTriangle size={13} className="inline ml-1 text-yellow-300" /></span>}
                  </td>
                  <td className="p-3 text-right tabular-nums">${p.unitCost}</td>
                  <td className="p-3"><div className="flex justify-end gap-1.5">
                    <button className="btn-ghost btn-sm" onClick={() => setAdjust(p)}><ArrowDownToLine size={14} /> Stock</button>
                    <button className="btn-ghost btn-sm" onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`}><Pencil size={14} /></button>
                    <button className="btn-ghost btn-sm" onClick={() => setHistory(p)} aria-label={`History for ${p.name}`}><History size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <Empty><Package className="mx-auto mb-2 text-ink-500" />No parts found. Add your first part.</Empty>}

      <PartModal target={edit} onClose={() => setEdit(null)} onSaved={reload} />
      <AdjustModal part={adjust} onClose={() => setAdjust(null)} onSaved={reload} />
      <HistoryModal part={history} onClose={() => setHistory(null)} />
    </div>
  )
}

function PartModal({ target, onClose, onSaved }: { target: Part | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(blank)
  const isNew = target === 'new'
  const set = (k: keyof typeof blank, v: string) => setF((s) => ({ ...s, [k]: v }))
  useEffect(() => {
    if (target === 'new') setF(blank)
    else if (target) setF({ sku: target.sku, name: target.name, category: target.category, stock: String(target.stock), reorderLevel: String(target.reorderLevel), unitCost: String(target.unitCost), supplier: target.supplier, location: target.location, description: target.description ?? '' })
  }, [target])
  const valid = f.sku.trim() && f.name.trim() && Number(f.unitCost) >= 0 && Number(f.reorderLevel) >= 0 && (!isNew || Number(f.stock) >= 0)
  return (
    <Modal open={!!target} onClose={onClose} title={isNew ? 'Add part' : 'Edit part'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU *"><input value={f.sku} onChange={(e) => set('sku', e.target.value)} className="uppercase" placeholder="BMP-CIV-F" /></Field>
          <Field label="Category"><select value={f.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <div className="col-span-2"><Field label="Part name *"><input value={f.name} onChange={(e) => set('name', e.target.value)} /></Field></div>
          {isNew && <Field label="Opening stock"><input type="number" min={0} value={f.stock} onChange={(e) => set('stock', e.target.value)} /></Field>}
          <Field label="Reorder level" hint="Alerts staff at or below this"><input type="number" min={0} value={f.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} /></Field>
          <Field label="Unit cost"><input type="number" min={0} step="0.01" value={f.unitCost} onChange={(e) => set('unitCost', e.target.value)} /></Field>
          <Field label="Shelf / location"><input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="A1" /></Field>
          <div className="col-span-2"><Field label="Supplier"><input value={f.supplier} onChange={(e) => set('supplier', e.target.value)} /></Field></div>
          <div className="col-span-2"><Field label="Notes"><textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field></div>
        </div>
        {!isNew && <p className="text-xs text-ink-500">To change the quantity, use <b>Stock</b> so the change is logged.</p>}
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          {!isNew && target ? <ActionButton className="btn-ghost" confirm={(target as Part).active ? 'Archive this part? It disappears from technician requests but history is kept.' : undefined} onAction={async () => { await api.patch(`/parts/${(target as Part)._id}`, { active: !(target as Part).active }); onSaved(); onClose() }}>{(target as Part).active ? 'Archive' : 'Restore'}</ActionButton> : <span />}
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <ActionButton disabled={!valid} success={isNew ? 'Part added' : 'Saved'} onAction={async () => {
              const body = { sku: f.sku, name: f.name, category: f.category, reorderLevel: Number(f.reorderLevel), unitCost: Number(f.unitCost), supplier: f.supplier, location: f.location, description: f.description }
              if (isNew) await api.post('/parts', { ...body, stock: Number(f.stock) })
              else await api.patch(`/parts/${(target as Part)._id}`, body)
              onSaved(); onClose()
            }}>{isNew ? 'Add part' : 'Save'}</ActionButton>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function AdjustModal({ part, onClose, onSaved }: { part: Part | null; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<'receive' | 'issue' | 'correction'>('receive')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { if (part) { setType('receive'); setQty(''); setNote('') } }, [part])
  const n = Number(qty)
  const after = !part || qty === '' ? null : type === 'receive' ? part.stock + n : type === 'issue' ? part.stock - n : n
  const valid = qty !== '' && Number.isFinite(n) && n >= 0 && (type === 'correction' || n > 0) && (after ?? 0) >= 0
  const TYPES = [['receive', 'Receive stock'], ['issue', 'Issue / remove'], ['correction', 'Set exact count']] as const
  return (
    <Modal open={!!part} onClose={onClose} title={`Adjust stock — ${part?.name ?? ''}`}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">{TYPES.map(([id, label]) => <button key={id} onClick={() => setType(id)} className={clsx('rounded-lg px-2 min-h-[44px] text-xs font-medium border', type === id ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300')}>{label}</button>)}</div>
        <Field label={type === 'correction' ? 'Counted quantity' : 'Quantity'}><input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></Field>
        <Field label="Note / reference"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'receive' ? 'Supplier invoice or PO number' : 'Reason'} /></Field>
        {part && <p className="text-sm text-ink-300">Current <b className="text-white">{part.stock}</b>{after !== null && <> → after <b className={after < 0 ? 'text-red-300' : 'text-emerald-300'}>{after}</b></>}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton disabled={!valid} success="Stock updated" onAction={async () => { await api.post(`/parts/${part!._id}/adjust`, { type, qty: n, note }); onSaved(); onClose() }}>Update stock</ActionButton>
        </div>
      </div>
    </Modal>
  )
}

function HistoryModal({ part, onClose }: { part: Part | null; onClose: () => void }) {
  const { data, loading } = useLoad<Movement[]>(part ? `/parts/${part._id}/movements` : null)
  return (
    <Modal open={!!part} onClose={onClose} title={`Stock history — ${part?.name ?? ''}`}>
      {loading || !data ? <Loading /> : data.length ? (
        <ul className="divide-y divide-ink-700 max-h-[60vh] overflow-y-auto">
          {data.map((m) => (
            <li key={m._id} className="py-3 flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0"><div className="capitalize text-white">{m.type}{m.job && <span className="text-ink-400"> · {m.job.orderNo}</span>}</div><div className="text-xs text-ink-500">{m.by?.name} · {fmtDateTime(m.createdAt)}{m.note && ` · ${m.note}`}</div></div>
              <div className="text-right shrink-0"><div className={clsx('font-semibold tabular-nums', m.delta >= 0 ? 'text-emerald-300' : 'text-red-300')}>{m.delta >= 0 ? '+' : ''}{m.delta}</div><div className="text-xs text-ink-500">balance {m.balanceAfter}</div></div>
            </li>
          ))}
        </ul>
      ) : <Empty>No movements yet.</Empty>}
    </Modal>
  )
}
