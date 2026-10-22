import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import { getSocket } from './socket'

// Fetches on mount and whenever any of the named socket events fire
export function useLoad<T>(path: string | null, events: string[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)

  const load = useCallback(async () => {
    if (!path) return
    const id = ++seq.current
    try {
      const d = await api.get<T>(path)
      if (id === seq.current) { setData(d); setError('') }
    } catch (e) {
      if (id === seq.current) setError((e as Error).message)
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [path])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const key = events.join(',')
  useEffect(() => {
    const s = getSocket()
    if (!s || !key) return
    const names = key.split(',')
    names.forEach((n) => s.on(n, load))
    return () => { names.forEach((n) => s.off(n, load)) }
  }, [key, load])

  return { data, error, loading, reload: load, setData }
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
