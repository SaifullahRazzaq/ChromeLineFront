import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

type T = { id: number; text: string; tone: 'ok' | 'err' }
const Ctx = createContext<(text: string, tone?: 'ok' | 'err') => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<T[]>([])
  const push = useCallback((text: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, text, tone }])
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), tone === 'err' ? 5000 : 2800)
  }, [])
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed z-[100] left-4 right-4 bottom-20 lg:bottom-6 lg:left-auto lg:right-6 lg:w-96 flex flex-col gap-2 pointer-events-none" role="status" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`pointer-events-auto flex items-start gap-2 rounded-lg px-4 py-3 text-sm shadow-xl border ${t.tone === 'ok' ? 'bg-ink-800 border-emerald-600/50 text-emerald-200' : 'bg-ink-800 border-red-600/60 text-red-200'}`}>
              {t.tone === 'ok' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
