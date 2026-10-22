import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ErrorNote, Field } from '../components/ui'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/dashboard" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try { await login(email, password) } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-b from-ink-900 to-ink-950">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500 grid place-items-center"><Wrench className="text-white" /></div>
          <div><h1 className="text-xl font-bold">Chromeline</h1><p className="text-sm text-ink-400">Workshop operations portal</p></div>
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Field label="Email"><input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <Link to="/" className="block text-center text-sm text-ink-400 hover:text-white">← Back to website</Link>
        {import.meta.env.DEV && <p className="text-xs text-ink-500">Demo: tech@chromeline.test · supervisor@chromeline.test · admin@chromeline.test — Password123!</p>}
      </form>
    </div>
  )
}
