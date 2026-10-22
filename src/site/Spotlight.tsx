import { useRef, type ReactNode } from 'react'
import clsx from 'clsx'

// Card with a glow that follows the pointer
export default function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div ref={ref} className={clsx('group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/70 transition-colors hover:border-brand-500/50', className)}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        ref.current!.style.setProperty('--x', `${e.clientX - r.left}px`)
        ref.current!.style.setProperty('--y', `${e.clientY - r.top}px`)
      }}>
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'radial-gradient(360px circle at var(--x,50%) var(--y,50%), rgba(249,115,22,.18), transparent 60%)' }} aria-hidden />
      <div className="relative h-full">{children}</div>
    </div>
  )
}
