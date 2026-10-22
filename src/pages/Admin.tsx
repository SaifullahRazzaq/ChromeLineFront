import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../lib/api'
import { useLoad } from '../lib/hooks'
import type { User } from '../lib/types'
import { useAuth } from '../auth/AuthContext'
import { ActionButton, Badge, Empty, Field, Loading, PromptModal, Section, Stat, Tabs } from '../components/ui'

interface Settings { shiftMinutes: number; maxBreakMinutes: number; workshopName: string; autoClockOutHours: number }
interface Fin { jobCount: number; totalEstimates: number; approvedEstimates: number; approvedSupplements: number; byStatus: Record<string, number> }

type Tab = 'people' | 'settings' | 'finance'

export default function Admin() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>(user?.role === 'admin' ? 'people' : 'finance')
  if (!user || (user.role !== 'admin' && !user.can.viewFinancials)) return <Navigate to="/dashboard" replace />
  const tabs: { id: Tab; label: string }[] = [
    ...(user.can.manageTechnicians ? [{ id: 'people' as Tab, label: 'People & permissions' }] : []),
    ...(user.can.manageSettings ? [{ id: 'settings' as Tab, label: 'System settings' }] : []),
    ...(user.can.viewFinancials ? [{ id: 'finance' as Tab, label: 'Financial reports' }] : []),
  ]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Administration</h1>
      <Tabs value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'people' && <People />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'finance' && <Finance />}
    </div>
  )
}

const PERMS: { key: 'approveQC' | 'viewFinancials' | 'manageTechnicians'; label: string }[] = [
  { key: 'approveQC', label: 'Approve QC' }, { key: 'viewFinancials', label: 'Financials' }, { key: 'manageTechnicians', label: 'Manage techs' },
]

function People() {
  const { user: me } = useAuth()
  const { data, reload } = useLoad<User[]>('/admin/users')
  const [open, setOpen] = useState(false)
  if (!data) return <Loading />
  const patch = (id: string, body: unknown) => async () => { await api.patch(`/admin/users/${id}`, body); reload() }
  return (
    <Section title="Users" action={<button className="btn-primary btn-sm" onClick={() => setOpen(true)}><Plus size={14} /> Add user</button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-ink-400 text-left"><tr><th className="py-2">Name</th><th>Role</th><th>Grants</th><th className="text-right">Status</th></tr></thead>
          <tbody className="divide-y divide-ink-700">
            {data.map((u) => (
              <tr key={u._id}>
                <td className="py-3"><div className="text-white">{u.name}</div><div className="text-xs text-ink-500">{u.email}</div></td>
                <td>
                  <select className="w-32" value={u.role} disabled={u._id === me?._id} aria-label={`Role for ${u.name}`}
                    onChange={(e) => patch(u._id, { role: e.target.value })().catch(() => {})}>
                    <option value="technician">technician</option><option value="supervisor">supervisor</option><option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {PERMS.map((p) => (
                      <label key={p.key} className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                        <input type="checkbox" checked={!!u.permissions?.[p.key]} onChange={(e) => patch(u._id, { permissions: { [p.key]: e.target.checked } })().catch(() => {})} /> {p.label}
                      </label>
                    ))}
                  </div>
                </td>
                <td className="text-right">
                  <ActionButton className={u.active ? 'btn-ghost btn-sm' : 'btn-ok btn-sm'} disabled={u._id === me?._id} onAction={patch(u._id, { active: !u.active })}>{u.active ? 'Deactivate' : 'Activate'}</ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-500 mt-3">Technicians approve QC only when granted; supervisors and admins can always approve. Nobody can approve their own repair.</p>
      <PromptModal open={open} onClose={() => setOpen(false)} title="Add user" submitLabel="Create"
        fields={[{ name: 'name', label: 'Name', required: true }, { name: 'email', label: 'Email', required: true }, { name: 'password', label: 'Temporary password (8+ chars)', required: true },
          { name: 'role', label: 'Role', type: 'select', options: ['technician', 'supervisor', 'admin'] }, { name: 'specialty', label: 'Specialty' }]}
        onSubmit={async (v) => { await api.post('/admin/users', v); reload() }} />
    </Section>
  )
}

function SettingsTab() {
  const { data, reload } = useLoad<Settings>('/admin/settings')
  const [s, setS] = useState<Settings | null>(null)
  useEffect(() => { if (data) setS(data) }, [data])
  if (!s) return <Loading />
  return (
    <Section title="System settings">
      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <Field label="Workshop name"><input value={s.workshopName} onChange={(e) => setS({ ...s, workshopName: e.target.value })} /></Field>
        <Field label="Standard shift (minutes)" hint="Time beyond this counts as overtime"><input type="number" min={60} value={s.shiftMinutes} onChange={(e) => setS({ ...s, shiftMinutes: Number(e.target.value) })} /></Field>
        <Field label="Max daily break (minutes)"><input type="number" min={0} value={s.maxBreakMinutes} onChange={(e) => setS({ ...s, maxBreakMinutes: Number(e.target.value) })} /></Field>
        <Field label="Auto clock-out after (hours)"><input type="number" min={1} value={s.autoClockOutHours} onChange={(e) => setS({ ...s, autoClockOutHours: Number(e.target.value) })} /></Field>
      </div>
      <div className="mt-4"><ActionButton success="Settings saved" onAction={async () => { await api.put('/admin/settings', s); reload() }}>Save settings</ActionButton></div>
    </Section>
  )
}

function Finance() {
  const { data } = useLoad<Fin>('/admin/reports/financial')
  if (!data) return <Loading />
  const money = (n: number) => `$${n.toLocaleString()}`
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Repair orders" value={data.jobCount} />
        <Stat label="Total estimates" value={money(data.totalEstimates)} />
        <Stat label="Customer-approved" value={money(data.approvedEstimates)} tone="text-emerald-300" />
        <Stat label="Approved supplements" value={money(data.approvedSupplements)} tone="text-brand-400" />
      </div>
      <Section title="Estimate value by status">
        {Object.keys(data.byStatus).length ? (
          <ul className="divide-y divide-ink-700">
            {Object.entries(data.byStatus).map(([k, v]) => <li key={k} className="py-2.5 flex justify-between text-sm"><Badge>{k.replace(/_/g, ' ')}</Badge><span className="tabular-nums text-white">{money(v)}</span></li>)}
          </ul>
        ) : <Empty>No data.</Empty>}
      </Section>
    </div>
  )
}
