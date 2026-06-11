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
      subtitle="Sign in to your Oviq account."
      footerText="Don't have an account?"
      footerLink="Sign up"
      footerHref="/signup"
    >
      <form onSubmit={handleSubmit}>
        <div className="afield">
          <div className="lab"><label htmlFor="email">Email</label></div>
          <input type="email" id="email" required value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="afield">
          <div className="lab">
            <label htmlFor="password">Password</label>
            <a className="forgot" href="#">Forgot?</a>
          </div>
          <input type="password" id="password" required value={password}
            onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <div className="auth-err">{error}</div>}
        <button type="submit" disabled={loading}
          className="btn btn-primary btn-lg btn-block" style={{ marginTop: 4 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  )
}
