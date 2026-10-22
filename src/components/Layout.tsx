import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, ClipboardCheck, Clock, Boxes, Gauge, Inbox, LayoutDashboard, ListChecks, LogOut, MessageSquare, MoreHorizontal, Package, Settings, UserPlus, Users, Wrench } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../auth/AuthContext'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'
import type { Notice } from '../lib/types'
import { Modal } from './ui'
import { useToast } from './Toast'

interface NavItem { to: string; label: string; icon: typeof Gauge; show?: boolean }

export default function Layout() {
  const { user, logout } = useAuth()
  const [unread, setUnread] = useState(0)
  const [more, setMore] = useState(false)
  const toast = useToast()
  const nav = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    api.get<{ unread: number }>('/notifications?limit=1').then((r) => setUnread(r.unread)).catch(() => {})
    const s = getSocket()
    if (!s) return
    const onN = (n: Notice) => { setUnread((c) => c + 1); toast(n.title + (n.body ? ` — ${n.body}` : '')) }
    s.on('notification', onN)
    const onRead = () => setUnread(0)
    window.addEventListener('pb:notifications-read', onRead)
    return () => { s.off('notification', onN); window.removeEventListener('pb:notifications-read', onRead) }
  }, [toast])

  if (!user) return null
  const staff = user.role !== 'technician'
  const items: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/jobs', label: staff ? 'Repair jobs' : 'My jobs', icon: Wrench },
    { to: '/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/qc', label: 'Quality control', icon: ClipboardCheck },
    { to: '/parts', label: 'Parts', icon: Package },
    { to: '/attendance', label: 'Attendance', icon: Clock },
    { to: '/messages', label: 'Messages', icon: MessageSquare },
    { to: '/team', label: 'Team', icon: Users, show: staff },
    { to: '/technicians', label: 'Technicians', icon: UserPlus, show: staff },
    { to: '/inventory', label: 'Inventory', icon: Boxes, show: staff },
    { to: '/inquiries', label: 'Inquiries', icon: Inbox, show: staff },
    { to: '/admin', label: 'Admin', icon: Settings, show: user.role === 'admin' || user.can.viewFinancials },
  ].filter((i) => i.show !== false)

  const primary = items.slice(0, 4)
  const rest = items.slice(4)

  const link = ({ isActive }: { isActive: boolean }) =>
    clsx('flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-brand-500/15 text-brand-400' : 'text-ink-300 hover:bg-ink-800 hover:text-white')

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-ink-900 border-r border-ink-700 h-screen sticky top-0 p-4">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-brand-500 grid place-items-center"><Wrench size={20} className="text-white" /></div>
          <div>
            <div className="font-bold text-white leading-tight">PrimeBody</div>
            <div className="text-[11px] text-ink-400 uppercase tracking-wider">{staff ? 'Workshop ops' : 'Technician portal'}</div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/dashboard'} className={link}>
              <i.icon size={18} /> {i.label}
              {i.to === '/messages' && unread > 0 && <span className="ml-auto rounded-full bg-brand-500 text-white text-[11px] px-2">{unread}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-ink-700 pt-3">
          <div className="px-2 mb-2">
            <div className="text-sm font-semibold text-white truncate">{user.name}</div>
            <div className="text-xs text-ink-400 capitalize">{user.role}</div>
          </div>
          <button className="btn-ghost w-full justify-start" onClick={logout}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 bg-ink-900/95 backdrop-blur border-b border-ink-700 flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 font-bold text-white"><div className="w-7 h-7 rounded-md bg-brand-500 grid place-items-center"><Wrench size={15} /></div> PrimeBody</div>
          <button className="relative p-2 -mr-2" aria-label={`Notifications (${unread} unread)`} onClick={() => nav('/messages')}>
            <Bell size={22} />
            {unread > 0 && <span className="absolute top-0.5 right-0 rounded-full bg-brand-500 text-white text-[10px] min-w-[18px] h-[18px] grid place-items-center">{unread}</span>}
          </button>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 pb-28 lg:pb-8">
          <motion.div key={pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-900/95 backdrop-blur border-t border-ink-700 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]" aria-label="Primary">
        {primary.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/dashboard'} className={({ isActive }) => clsx('flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium', isActive ? 'text-brand-400' : 'text-ink-400')}>
            <i.icon size={21} />{i.label.split(' ')[0]}
          </NavLink>
        ))}
        <button className="flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-medium text-ink-400" onClick={() => setMore(true)}>
          <MoreHorizontal size={21} />More
        </button>
      </nav>

      <Modal open={more} onClose={() => setMore(false)} title="More">
        <div className="space-y-1">
          {rest.map((i) => (
            <NavLink key={i.to} to={i.to} onClick={() => setMore(false)} className={link}><i.icon size={18} /> {i.label}</NavLink>
          ))}
          <div className="border-t border-ink-700 pt-3 mt-3 flex items-center justify-between">
            <div><div className="text-sm font-semibold text-white">{user.name}</div><div className="text-xs text-ink-400 capitalize">{user.role}</div></div>
            <button className="btn-ghost" onClick={logout}><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
