'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Oviq account"
      footerText="Don't have an account?"
      footerLink="Sign up"
      footerHref="/signup"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com" className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Password</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }} />
        </div>
        {error && (
          <p className="text-xs rounded-lg px-3 py-2.5" style={{
            color: 'var(--danger)', background: 'rgba(224,80,80,0.1)',
            border: '1px solid rgba(224,80,80,0.2)' }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 mt-2"
          style={{ background: 'var(--aqua)', color: 'var(--slate-dark)' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
