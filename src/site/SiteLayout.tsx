import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion, useScroll, useSpring } from 'framer-motion'
import { Clock, Mail, MapPin, Menu, Phone, Wrench, X } from 'lucide-react'
import clsx from 'clsx'
import { BUSINESS, PHOTO_CREDITS, SERVICES } from './content'

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Services' },
  { to: '/track', label: 'Track Repair' },
  { to: '/contact', label: 'Contact' },
]

export default function SiteLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])

  const link = ({ isActive }: { isActive: boolean }) =>
    clsx('px-3 min-h-[44px] inline-flex items-center text-sm font-medium transition-colors', isActive ? 'text-brand-400' : 'text-ink-300 hover:text-white')

  return (
    <div className="min-h-screen flex flex-col bg-ink-950">
      <motion.div style={{ scaleX: progress }} className="fixed top-0 inset-x-0 h-[3px] bg-gradient-to-r from-brand-400 to-red-500 origin-left z-50" aria-hidden />
      <header className="sticky top-0 z-40 bg-ink-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-white text-xl">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-red-600 grid place-items-center shadow-lg shadow-brand-500/30"><Wrench size={19} /></span>{BUSINESS.name}
          </Link>
          <nav className="hidden md:flex items-center" aria-label="Main">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={link}>{l.label}</NavLink>)}
            <Link to="/contact" className="btn-primary ml-3">Get a free quote</Link>
          </nav>
          <button className="md:hidden p-2 -mr-2" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <nav className="md:hidden border-t border-ink-800 px-4 py-2 flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={link}>{l.label}</NavLink>)}
            <Link to="/contact" className="btn-primary my-2">Get a free quote</Link>
          </nav>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-ink-900/80 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 font-bold text-white text-lg mb-3"><span className="w-8 h-8 rounded-lg bg-brand-500 grid place-items-center"><Wrench size={17} /></span>{BUSINESS.name}</div>
            <p className="text-ink-400">{BUSINESS.tagline}. Quality repairs, honest estimates, and every job checked before it leaves.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Services</h3>
            <ul className="space-y-2 text-ink-400">{SERVICES.map((s) => <li key={s.id}><Link className="hover:text-white" to={`/services#${s.id}`}>{s.title}</Link></li>)}</ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Visit us</h3>
            <ul className="space-y-2 text-ink-400">
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand-400" />{BUSINESS.address}</li>
              <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-brand-400" /><a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="hover:text-white">{BUSINESS.phone}</a></li>
              <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-brand-400" /><a href={`mailto:${BUSINESS.email}`} className="hover:text-white">{BUSINESS.email}</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Opening hours</h3>
            <ul className="space-y-2 text-ink-400">{BUSINESS.hours.map(([d, t]) => <li key={d} className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-brand-400" /><span>{d}<br /><span className="text-ink-300">{t}</span></span></li>)}</ul>
          </div>
        </div>
        <div className="border-t border-ink-800 py-4 px-4 text-xs text-ink-500 flex flex-wrap justify-between gap-2 max-w-6xl mx-auto sm:px-6">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <span className="basis-full text-ink-600">{PHOTO_CREDITS}</span>
          <Link to="/login" className="hover:text-white">Staff login</Link>
        </div>
      </footer>
    </div>
  )
}
