import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import clsx from 'clsx'
import { PRIORITY_TONE, STATUS_LABEL, STATUS_TONE } from '../lib/format'
import type { JobStatus, Priority } from '../lib/types'
import { useToast } from './Toast'

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={clsx('card', className)}>{children}</div>
)

export const Section = ({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={clsx('card p-4 sm:p-5', className)}>
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
      {action}
    </div>
    {children}
  </section>
)

export const Badge = ({ tone = 'bg-ink-600 text-ink-200', children }: { tone?: string; children: ReactNode }) => (
  <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tone)}>{children}</span>
)

export const StatusBadge = ({ status }: { status: JobStatus }) => <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
export const PriorityBadge = ({ priority }: { priority: Priority }) => <Badge tone={PRIORITY_TONE[priority]}>{priority}</Badge>

export const Progress = ({ value, className }: { value: number; className?: string }) => (
  <div className={clsx('h-2 rounded-full bg-ink-700 overflow-hidden', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
    <motion.div className="h-full bg-brand-500" initial={false} animate={{ width: `${value}%` }} transition={{ duration: 0.4 }} />
  </div>
)

export const Spinner = () => <Loader2 className="animate-spin text-brand-400" size={22} />
export const Loading = () => <div className="py-16 flex justify-center"><Spinner /></div>

export const Empty = ({ children }: { children: ReactNode }) => (
  <div className="text-center text-sm text-ink-400 py-8 px-4">{children}</div>
)

export const ErrorNote = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg border border-red-600/40 bg-red-500/10 text-red-200 text-sm px-4 py-3">{children}</div>
)

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className="label">{label}</span>
    {children}
    {hint && <span className="block text-xs text-ink-500 mt-1">{hint}</span>}
  </label>
)

// Button that tracks its own async action and surfaces errors as toasts
export function ActionButton({ onAction, success, children, className = 'btn-primary', confirm, ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & { onAction: () => Promise<unknown>; success?: string; confirm?: string }) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  return (
    <button {...rest} className={className} disabled={busy || rest.disabled}
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return
        setBusy(true)
        try { await onAction(); if (success) toast(success) } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
      }}>
      {busy && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="card w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-b-none sm:rounded-b-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button className="p-2 -m-2 text-ink-400 hover:text-white" onClick={onClose} aria-label="Close"><X size={20} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Opens a modal with a single reason/description form and submits it
export function PromptModal({ open, onClose, title, fields, submitLabel, onSubmit }: {
  open: boolean; onClose: () => void; title: string; submitLabel: string
  fields: { name: string; label: string; type?: 'text' | 'textarea' | 'number' | 'date' | 'select'; options?: string[]; required?: boolean; placeholder?: string }[]
  onSubmit: (v: Record<string, string>) => Promise<unknown>
}) {
  const [v, setV] = useState<Record<string, string>>({})
  useEffect(() => { if (open) setV(Object.fromEntries(fields.map((f) => [f.name, f.type === 'select' ? f.options?.[0] ?? '' : '']))) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const missing = fields.some((f) => f.required && !v[f.name]?.trim())
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        {fields.map((f) => (
          <Field key={f.name} label={f.label}>
            {f.type === 'textarea' ? <textarea rows={3} value={v[f.name] ?? ''} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />
              : f.type === 'select' ? <select value={v[f.name] ?? ''} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
              : <input type={f.type ?? 'text'} value={v[f.name] ?? ''} placeholder={f.placeholder} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} />}
          </Field>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton disabled={missing} onAction={async () => { await onSubmit(v); onClose() }}>{submitLabel}</ActionButton>
        </div>
      </div>
    </Modal>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; badge?: number }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-ink-700" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={clsx('relative px-4 py-3 text-sm font-semibold whitespace-nowrap min-h-[44px] transition-colors', value === t.id ? 'text-brand-400' : 'text-ink-400 hover:text-ink-200')}>
          {t.label}
          {!!t.badge && <span className="ml-1.5 rounded-full bg-brand-500 text-white text-[10px] px-1.5 py-0.5">{t.badge}</span>}
          {value === t.id && <motion.span layoutId="tab-underline" className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand-500" />}
        </button>
      ))}
    </div>
  )
}

export function CheckList({ items, onToggle, readOnly }: { items: { key: string; label: string; done: boolean }[]; onToggle: (key: string, done: boolean) => Promise<unknown> | void; readOnly?: boolean }) {
  const toast = useToast()
  const done = items.filter((i) => i.done).length
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Progress value={items.length ? (done / items.length) * 100 : 0} className="flex-1" />
        <span className="text-xs text-ink-400 tabular-nums">{done}/{items.length}</span>
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.key}>
            <label className={clsx('flex items-center gap-3 rounded-lg px-3 min-h-[48px] cursor-pointer hover:bg-ink-700/60', i.done && 'text-ink-400')}>
              <input type="checkbox" checked={i.done} disabled={readOnly}
                onChange={async (e) => { try { await onToggle(i.key, e.target.checked) } catch (err) { toast((err as Error).message, 'err') } }} />
              <span className={clsx('text-sm', i.done && 'line-through')}>{i.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const Stat = ({ label, value, sub, tone = 'text-white', onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string; onClick?: () => void }) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={clsx('card p-4 text-left w-full', onClick && 'hover:border-brand-500/60 transition-colors')}>
      <div className="text-xs uppercase tracking-wide text-ink-400">{label}</div>
      <div className={clsx('text-3xl font-bold tabular-nums mt-1', tone)}>{value}</div>
      {sub && <div className="text-xs text-ink-400 mt-1">{sub}</div>}
    </Tag>
  )
}
