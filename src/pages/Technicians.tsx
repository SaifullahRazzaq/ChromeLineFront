import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { KeyRound, Pencil, Phone, Plus, Search, Shuffle, UserCheck, UserX } from 'lucide-react'
import clsx from 'clsx'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import { fmtDate } from '../lib/format'
import type { User } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Badge, Empty, ErrorNote, Field, Loading, Modal } from '../components/ui'

interface Report { technician: { _id: string }; activeJobs: number; completedJobs: number; overdueJobs: number }

const SPECIALTIES = ['Body & paint', 'Dent removal', 'Painting', 'Frame & structural', 'Mechanical', 'Electrical', 'Detailing']
const strongPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(12))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('') + '!9'
}

const blank = { name: '', email: '', phone: '', employeeId: '', specialty: '', skills: '', joinedAt: '', address: '', ecName: '', ecPhone: '', password: '', role: 'technician' }

export default function Technicians() {
  const { user } = useAuth()
  const staff = user?.role !== 'technician'
  const isAdmin = user?.role === 'admin'
  const [q, setQ] = useState('')
  const [show, setShow] = useState<'active' | 'all'>('active')
  const users = useLoad<User[]>(staff ? '/admin/users' : null)
  const report = useLoad<Report[]>(staff ? '/admin/reports/team' : null, ['job:updated'])
  const [editing, setEditing] = useState<User | 'new' | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)

  if (!staff) return <Navigate to="/dashboard" replace />
  const stats = new Map(report.data?.map((r) => [r.technician._id, r]))
  const list = (users.data ?? [])
    .filter((u) => (show === 'all' ? true : u.active !== false))
    .filter((u) => !q || [u.name, u.email, u.employeeId, u.specialty, u.phone, ...(u.skills ?? [])].some((v) => v?.toLowerCase().includes(q.toLowerCase())))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Technicians</h1><p className="text-sm text-ink-400">{isAdmin ? 'Manage technicians, supervisors and admins.' : 'Add and manage technician accounts.'}</p></div>
        <button className="btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Add technician</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input className="pl-9" placeholder="Search name, ID, phone, skill…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search technicians" /></div>
        {(['active', 'all'] as const).map((s) => <button key={s} onClick={() => setShow(s)} className={clsx('rounded-full px-4 min-h-[44px] text-sm border', show === s ? 'bg-brand-500 border-brand-500 text-white' : 'border-ink-600 text-ink-300')}>{s === 'active' ? 'Active' : 'Include inactive'}</button>)}
      </div>

      {users.loading ? <Loading /> : users.error ? <ErrorNote>{users.error}</ErrorNote> : list.length ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((u) => {
            const st = stats.get(u._id)
            return (
              <div key={u._id} className={clsx('card p-4 space-y-3', u.active === false && 'opacity-60')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-red-600 grid place-items-center font-bold text-white">{u.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</span>
                    <div className="min-w-0"><div className="font-semibold text-white truncate">{u.name}</div><div className="text-xs text-ink-400 truncate">{u.email}</div></div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge tone={u.role === 'admin' ? 'bg-violet-500/15 text-violet-300' : u.role === 'supervisor' ? 'bg-sky-500/15 text-sky-300' : 'bg-ink-600 text-ink-200'}>{u.role}</Badge>
                    {u.active === false && <Badge tone="bg-red-500/15 text-red-300">inactive</Badge>}
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div><dt className="text-ink-500">Employee ID</dt><dd className="text-ink-200">{u.employeeId || '—'}</dd></div>
                  <div><dt className="text-ink-500">Joined</dt><dd className="text-ink-200">{fmtDate(u.joinedAt)}</dd></div>
                  <div><dt className="text-ink-500">Specialty</dt><dd className="text-ink-200">{u.specialty || '—'}</dd></div>
                  <div><dt className="text-ink-500">Phone</dt><dd className="text-ink-200">{u.phone ? <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1 text-brand-400"><Phone size={11} />{u.phone}</a> : '—'}</dd></div>
                </dl>
                {!!u.skills?.length && <div className="flex flex-wrap gap-1">{u.skills.map((s) => <Badge key={s} tone="bg-ink-700 text-ink-300">{s}</Badge>)}</div>}
                {st && u.role === 'technician' && (
                  <div className="grid grid-cols-3 gap-2 text-center rounded-lg bg-ink-900 py-2">
                    <div><div className="text-lg font-semibold text-white">{st.activeJobs}</div><div className="text-[10px] uppercase text-ink-500">Active</div></div>
                    <div><div className="text-lg font-semibold text-white">{st.completedJobs}</div><div className="text-[10px] uppercase text-ink-500">Done</div></div>
                    <div><div className={clsx('text-lg font-semibold', st.overdueJobs ? 'text-red-300' : 'text-white')}>{st.overdueJobs}</div><div className="text-[10px] uppercase text-ink-500">Overdue</div></div>
                  </div>
                )}
                {(isAdmin || u.role === 'technician') && (
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-ghost btn-sm" onClick={() => setEditing(u)}><Pencil size={14} /> Edit</button>
                    <button className="btn-ghost btn-sm" onClick={() => setResetting(u)}><KeyRound size={14} /> Password</button>
                    {u._id !== user?._id && (
                      <ActionButton className="btn-ghost btn-sm" confirm={u.active === false ? undefined : `Deactivate ${u.name}? They will not be able to sign in.`} success={u.active === false ? 'Activated' : 'Deactivated'}
                        onAction={async () => { await api.patch(`/admin/users/${u._id}`, { active: u.active === false }); users.reload() }}>
                        {u.active === false ? <><UserCheck size={14} /> Activate</> : <><UserX size={14} /> Deactivate</>}
                      </ActionButton>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : <Empty>No technicians match.</Empty>}

      <TechnicianModal target={editing} isAdmin={isAdmin} onClose={() => setEditing(null)} onSaved={() => { users.reload(); report.reload() }} />
      <ResetModal target={resetting} onClose={() => setResetting(null)} />
    </div>
  )
}

function TechnicianModal({ target, isAdmin, onClose, onSaved }: { target: User | 'new' | null; isAdmin: boolean; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(blank)
  const isNew = target === 'new'
  const set = (k: keyof typeof blank, v: string) => setF((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    if (target === 'new') setF({ ...blank, joinedAt: new Date().toISOString().slice(0, 10), password: strongPassword() })
    else if (target) setF({ name: target.name, email: target.email, phone: target.phone ?? '', employeeId: target.employeeId ?? '', specialty: target.specialty ?? '', skills: (target.skills ?? []).join(', '), joinedAt: target.joinedAt?.slice(0, 10) ?? '', address: target.address ?? '', ecName: target.emergencyContact?.name ?? '', ecPhone: target.emergencyContact?.phone ?? '', password: '', role: target.role })
  }, [target])

  const valid = f.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && (!isNew || f.password.length >= 8)
  const save = async () => {
    const body = {
      name: f.name, phone: f.phone, specialty: f.specialty, skills: f.skills, joinedAt: f.joinedAt || undefined, address: f.address,
      emergencyContact: { name: f.ecName, phone: f.ecPhone }, employeeId: f.employeeId || undefined,
    }
    if (isNew) await api.post('/admin/users', { ...body, email: f.email, password: f.password, role: isAdmin ? f.role : undefined })
    else await api.patch(`/admin/users/${(target as User)._id}`, { ...body, employeeId: f.employeeId, ...(isAdmin ? { email: f.email, role: f.role } : {}) })
    onSaved(); onClose()
  }

  return (
    <Modal open={!!target} onClose={onClose} title={isNew ? 'Add technician' : 'Edit technician'}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Full name *"><input value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" /></Field></div>
          <div className="col-span-2"><Field label="Email (login) *"><input type="email" value={f.email} disabled={!isNew && !isAdmin} onChange={(e) => set('email', e.target.value)} autoComplete="off" /></Field></div>
          <Field label="Phone"><input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Employee ID" hint={isNew ? 'Leave blank to auto-generate' : undefined}><input value={f.employeeId} onChange={(e) => set('employeeId', e.target.value)} placeholder="TECH-003" /></Field>
          <Field label="Specialty"><input list="specialties" value={f.specialty} onChange={(e) => set('specialty', e.target.value)} /></Field>
          <Field label="Joining date"><input type="date" value={f.joinedAt} onChange={(e) => set('joinedAt', e.target.value)} /></Field>
          <div className="col-span-2"><Field label="Skills" hint="Separate with commas"><input value={f.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Dent removal, Spray painting, Welding" /></Field></div>
          <div className="col-span-2"><Field label="Address"><input value={f.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
          <Field label="Emergency contact"><input value={f.ecName} onChange={(e) => set('ecName', e.target.value)} placeholder="Name" /></Field>
          <Field label="Emergency phone"><input type="tel" value={f.ecPhone} onChange={(e) => set('ecPhone', e.target.value)} /></Field>
          {isAdmin && <div className="col-span-2"><Field label="Role"><select value={f.role} onChange={(e) => set('role', e.target.value)}><option value="technician">Technician</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></Field></div>}
        </div>
        <datalist id="specialties">{SPECIALTIES.map((s) => <option key={s} value={s} />)}</datalist>
        {isNew && (
          <Field label="Temporary password *" hint="Share it with the technician; they can change it after signing in.">
            <div className="flex gap-2"><input value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="off" className="font-mono" /><button type="button" className="btn-ghost" onClick={() => set('password', strongPassword())} aria-label="Generate password"><Shuffle size={16} /></button></div>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton disabled={!valid} success={isNew ? 'Technician added' : 'Saved'} onAction={save}>{isNew ? 'Add technician' : 'Save changes'}</ActionButton>
        </div>
      </div>
    </Modal>
  )
}

function ResetModal({ target, onClose }: { target: User | null; onClose: () => void }) {
  const [pw, setPw] = useState('')
  useEffect(() => { if (target) setPw(strongPassword()) }, [target])
  return (
    <Modal open={!!target} onClose={onClose} title={`Reset password — ${target?.name ?? ''}`}>
      <div className="space-y-3">
        <div className="flex gap-2"><input value={pw} onChange={(e) => setPw(e.target.value)} className="font-mono" aria-label="New password" /><button className="btn-ghost" onClick={() => setPw(strongPassword())} aria-label="Generate"><Shuffle size={16} /></button></div>
        <p className="text-xs text-ink-400">Copy it before saving — it is not shown again.</p>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <ActionButton disabled={pw.length < 8} success="Password updated" onAction={async () => { await api.patch(`/admin/users/${target!._id}`, { password: pw }); onClose() }}>Set password</ActionButton>
        </div>
      </div>
    </Modal>
  )
}
