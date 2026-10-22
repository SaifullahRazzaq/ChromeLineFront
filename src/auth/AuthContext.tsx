import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStore } from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'
import type { User } from '../lib/types'

interface Ctx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

  const logout = useCallback(() => {
    tokenStore.clear()
    disconnectSocket()
    setUser(null)
  }, [])

  useEffect(() => {
    if (!tokenStore.get()) return
    api.get<User>('/auth/me')
      .then((u) => { setUser(u); connectSocket() })
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    window.addEventListener('pb:unauthorized', logout)
    return () => window.removeEventListener('pb:unauthorized', logout)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
    tokenStore.set(r.token)
    setUser(r.user)
    connectSocket()
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
