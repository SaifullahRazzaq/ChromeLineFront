import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Phone, X } from 'lucide-react'
import { BUSINESS } from './content'
import ContactForm from './ContactForm'

interface Ctx { open: (service?: string) => void }
const ContactCtx = createContext<Ctx>({ open: () => {} })
export const useContact = () => useContext(ContactCtx)

// Lives for one page load, so a browser reload shows the pop-up again but moving between pages does not
let autoShown = false
const AUTO_OPEN_MS = 3500

export function ContactProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [service, setService] = useState<string | undefined>()
  const [instance, setInstance] = useState(0)
  const { pathname } = useLocation()

  const open = useCallback((s?: string) => { setService(s); setInstance((n) => n + 1); setIsOpen(true) }, [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (autoShown) return
    const t = setTimeout(() => { autoShown = true; if (window.location.pathname !== '/contact') setIsOpen(true) }, AUTO_OPEN_MS)
    return () => clearTimeout(t)
  }, [])

  // The Contact page already shows the form, so close the pop-up if the visitor navigates there
  useEffect(() => { if (pathname === '/contact') setIsOpen(false) }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [isOpen, close])

  return (
    <ContactCtx.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={close}>
            <motion.div role="dialog" aria-modal="true" aria-label="Contact us" onMouseDown={(e) => e.stopPropagation()}
              initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="relative w-full sm:max-w-2xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/60">
              <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-brand-500/25 blur-[90px] pointer-events-none" aria-hidden />
              <button onClick={close} aria-label="Close" className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-ink-300"><X size={20} /></button>
              <div className="relative p-6 sm:p-8">
                <span className="text-brand-400 text-xs font-semibold uppercase tracking-widest">Contact us</span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mt-1">Get a <span className="text-gradient">free quote</span></h2>
                <p className="text-ink-300 mt-2 mb-6 text-sm sm:text-base">Tell us about your vehicle and what happened — we will reply by phone or email.</p>
                <ContactForm key={instance} initialService={service} bare />
                <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-400 hover:text-white"><Phone size={15} className="text-brand-400" /> Prefer to talk? Call {BUSINESS.phone}</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ContactCtx.Provider>
  )
}
