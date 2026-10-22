import { useCallback, useRef, useState } from 'react'
import { ChevronsLeftRight } from 'lucide-react'
import clsx from 'clsx'
import { COMPARISONS } from './content'

export default function BeforeAfter() {
  const [idx, setIdx] = useState(0)
  const [pos, setPos] = useState(50)
  const [hinted, setHinted] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const c = COMPARISONS[idx]

  const move = useCallback((clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
    setHinted(true)
  }, [])

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6" role="tablist" aria-label="Example repairs">
        {COMPARISONS.map((x, i) => (
          <button key={x.id} role="tab" aria-selected={i === idx} onClick={() => { setIdx(i); setPos(50) }}
            className={clsx('rounded-full px-5 min-h-[44px] text-sm font-semibold border transition-colors', i === idx ? 'bg-brand-500 border-brand-500 text-white' : 'border-white/15 text-ink-300 hover:bg-white/5')}>{x.label}</button>
        ))}
      </div>
      <div ref={box} className="relative aspect-[4/3] sm:aspect-[16/9] rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 select-none touch-pan-y cursor-ew-resize"
        onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX) }}
        onPointerMove={(e) => e.buttons && move(e.clientX)}>
        <img src={c.after} alt={c.afterLabel} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={c.before} alt={c.beforeLabel} className="absolute inset-0 w-full h-full object-cover grayscale-[35%] contrast-110" style={{ objectPosition: (c as { beforePos?: string }).beforePos }} draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <span className="absolute top-4 left-4 rounded-full bg-black/70 backdrop-blur text-white text-xs font-semibold px-3.5 py-1.5">Before · {c.beforeLabel}</span>
        <span className="absolute top-4 right-4 rounded-full bg-brand-500 text-white text-xs font-semibold px-3.5 py-1.5">After · {c.afterLabel}</span>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_24px_rgba(255,255,255,.9)]" style={{ left: `${pos}%` }} aria-hidden>
          <span className={clsx('absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-12 h-12 rounded-full bg-white text-ink-900 grid place-items-center shadow-2xl', !hinted && 'animate-pulse')}><ChevronsLeftRight size={22} /></span>
        </div>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after" className="sr-only focus:not-sr-only focus:block focus:mt-3 focus:w-full" />
      <p className="text-center text-xs text-ink-500 mt-4">Illustrative comparison — different vehicles, shown to demonstrate the standard of finish we work to.</p>
    </div>
  )
}
