'use client'
import { useState } from 'react'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { signUp } from '@/lib/auth'

export default function SignupPage() {
  const [form, setForm] = useState({ fullName: '', companyName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.fullName, form.companyName)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We sent a confirmation link to your inbox."
        footerText="Already confirmed?"
        footerLink="Sign in"
        footerHref="/login"
      >
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--aqua-dim)', border: '1px solid rgba(39,201,182,0.25)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--aqua)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Confirm your email to activate your account, then sign in.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start resolving exceptions automatically"
      footerText="Already have an account?"
      footerLink="Sign in"
      footerHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Full name</label>
            <input type="text" required value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              placeholder="Alex Chen"
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Company</label>
            <input type="text" required value={form.companyName}
              onChange={e => update('companyName', e.target.value)}
              placeholder="Freight Co"
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Work email</label>
          <input type="email" required value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>Password</label>
          <input type="password" required minLength={8} value={form.password}
            onChange={e => update('password', e.target.value)}
            placeholder="Min 8 characters"
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' }}
          />
        </div>
        {error && (
          <p className="text-xs rounded-lg px-3 py-2.5" style={{
            color: 'var(--danger)', background: 'rgba(224,80,80,0.1)',
            border: '1px solid rgba(224,80,80,0.2)',
          }}>{error}</p>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-bold disabled:opacity-50 mt-2"
          style={{ background: 'var(--aqua)', color: 'var(--slate-dark)' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
          By signing up you agree to our <a href="#" style={{ color: 'var(--text-2)' }}>Terms</a> and <a href="#" style={{ color: 'var(--text-2)' }}>Privacy Policy</a>
        </p>
      </form>
    </AuthLayout>
  )
}
