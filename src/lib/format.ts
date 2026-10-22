import type { JobStatus, Priority } from './types'

export const fmtMins = (m = 0) => {
  const h = Math.floor(m / 60)
  const mm = Math.round(m % 60)
  return h ? `${h}h ${String(mm).padStart(2, '0')}m` : `${mm}m`
}

export const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—')
export const fmtDateTime = (d?: string) =>
  d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
export const fmtTime = (d?: string) => (d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—')

export function timeLeft(deadline?: string, now = Date.now()) {
  if (!deadline) return { text: 'No deadline', overdue: false, urgent: false }
  const diff = new Date(deadline).getTime() - now
  const abs = Math.abs(diff) / 60000
  const text = abs >= 2880 ? `${Math.round(abs / 1440)}d` : abs >= 60 ? `${Math.floor(abs / 60)}h ${Math.round(abs % 60)}m` : `${Math.round(abs)}m`
  return diff < 0 ? { text: `${text} overdue`, overdue: true, urgent: true } : { text: `${text} left`, overdue: false, urgent: diff < 6 * 3600e3 }
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In progress',
  paused: 'Paused',
  awaiting_parts: 'Awaiting parts',
  ready_for_qc: 'Ready for QC',
  rework: 'Rework',
  qc_passed: 'QC passed',
  ready_for_delivery: 'Ready for delivery',
}

export const STATUS_TONE: Record<JobStatus, string> = {
  assigned: 'bg-sky-500/15 text-sky-300',
  accepted: 'bg-indigo-500/15 text-indigo-300',
  in_progress: 'bg-brand-500/20 text-brand-300',
  paused: 'bg-yellow-500/15 text-yellow-300',
  awaiting_parts: 'bg-yellow-500/15 text-yellow-300',
  ready_for_qc: 'bg-violet-500/15 text-violet-300',
  rework: 'bg-red-500/15 text-red-300',
  qc_passed: 'bg-emerald-500/15 text-emerald-300',
  ready_for_delivery: 'bg-emerald-500/20 text-emerald-300',
}

export const PRIORITY_TONE: Record<Priority, string> = {
  urgent: 'bg-red-500/15 text-red-300',
  high: 'bg-brand-500/15 text-brand-300',
  normal: 'bg-ink-600 text-ink-200',
  low: 'bg-ink-700 text-ink-400',
}

export const REPAIR_LABEL: Record<string, string> = {
  body_panel: 'Body panel repair',
  dent_removal: 'Dent removal',
  bumper: 'Bumper repair',
  frame: 'Frame repair',
  paint_prep: 'Paint preparation',
  color_matching: 'Color matching',
  painting: 'Painting & refinishing',
  parts_replacement: 'Parts replacement',
  mechanical: 'Mechanical repair',
  reassembly: 'Reassembly',
}

export const vehicleName = (v: { make?: string; model?: string; year?: number }) => [v.year, v.make, v.model].filter(Boolean).join(' ')
