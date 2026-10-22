const BASE = import.meta.env.VITE_API_URL ?? ''
const KEY = 'pb_token'

export const tokenStore = {
  get: () => {
    try { return localStorage.getItem(KEY) } catch { return null }
  },
  set: (t: string) => {
    try { localStorage.setItem(KEY, t) } catch { /* private mode */ }
  },
  clear: () => {
    try { localStorage.removeItem(KEY) } catch { /* private mode */ }
  },
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown, form?: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  const t = tokenStore.get()
  if (t) headers.Authorization = `Bearer ${t}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}/api${path}`, { method, headers, body: form ?? (body !== undefined ? JSON.stringify(body) : undefined) })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') window.dispatchEvent(new Event('pb:unauthorized'))
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`)
  }
  return data as T
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b?: unknown) => request<T>('POST', p, b ?? {}),
  patch: <T>(p: string, b?: unknown) => request<T>('PATCH', p, b ?? {}),
  put: <T>(p: string, b?: unknown) => request<T>('PUT', p, b ?? {}),
  del: <T>(p: string) => request<T>('DELETE', p),
  upload: <T>(p: string, f: FormData) => request<T>('POST', p, undefined, f),
}

export const assetUrl = (u: string) => (u.startsWith('/uploads') ? `${BASE}${u}` : u)
