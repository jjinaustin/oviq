'use client'
import { Suspense, useState, useEffect } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Building, CreditCard, LogOut, Check, ExternalLink, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const PLANS = [
  { key: 'starter',      name: 'Starter',      price: '$299',   volume: 'Up to 500 loads / month' },
  { key: 'growth',       name: 'Growth',       price: '$799',   volume: 'Up to 5,000 loads / month' },
  { key: 'professional', name: 'Professional', price: '$1,999', volume: 'Up to 20,000 loads / month' },
]

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: 'var(--text-3)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>{title}</h2>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, description, action }: { label: string; description?: string; action: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{description}</p>}
      </div>
      <div className="ml-4 shrink-0">{action}</div>
    </div>
  )
}

function SettingsContent() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [editingOrg, setEditingOrg] = useState(false)
  const [orgName, setOrgName] = useState(user?.user_metadata?.company_name || '')
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgSaved, setOrgSaved] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [billingMessage, setBillingMessage] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetch(`${API}/api/v1/billing/subscription/${user.id}`)
        .then(r => r.json())
        .then(setSubscription)
        .catch(() => {})
    }
    const billing = searchParams.get('billing')
    if (billing === 'success') {
      setBillingMessage('Subscription activated successfully!')
      setTimeout(() => setBillingMessage(null), 5000)
    } else if (billing === 'cancelled') {
      setBillingMessage('Checkout cancelled — no changes made.')
      setTimeout(() => setBillingMessage(null), 4000)
    }
  }, [user])

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  async function handlePasswordReset() {
    if (!user?.email) return
    setResetLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      setResetSent(true)
    } catch (e) {
      console.error(e)
    } finally {
      setResetLoading(false)
    }
  }

  async function handleSaveOrg() {
    if (!orgName.trim()) return
    setOrgSaving(true)
    try {
      await supabase.auth.updateUser({ data: { company_name: orgName } })
      setOrgSaved(true)
      setEditingOrg(false)
      setTimeout(() => setOrgSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setOrgSaving(false)
    }
  }

  async function handleCheckout(plan: string) {
    if (!user) return
    setCheckoutLoading(plan)
    try {
      const res = await fetch(`${API}/api/v1/billing/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          user_id: user.id,
          email: user.email,
          org_id: user.user_metadata?.org_id || '',
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    if (!user) return
    setPortalLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/billing/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (e) {
      console.error(e)
    } finally {
      setPortalLoading(false)
    }
  }

  const activePlan = subscription?.status === 'active' ? subscription.plan : null

  return (
    <DashboardShell>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Manage your account and organization</p>
        </div>

        {billingMessage && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm" style={{
            background: billingMessage.includes('success') ? 'var(--aqua-dim)' : 'rgba(240,160,48,0.1)',
            border: `1px solid ${billingMessage.includes('success') ? 'rgba(39,201,182,0.25)' : 'rgba(240,160,48,0.25)'}`,
            color: billingMessage.includes('success') ? 'var(--aqua)' : '#f0a030',
          }}>{billingMessage}</div>
        )}

        <Section icon={User} title="Account">
          <Row
            label={user?.user_metadata?.full_name || 'Your Name'}
            description={user?.email}
            action={<span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>Admin</span>}
          />
          <Row
            label="Password"
            description={resetSent ? 'Reset link sent — check your email' : 'Send a password reset link to your email'}
            action={
              resetSent
                ? <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--aqua)' }}><Check size={13} /> Sent</span>
                : <Button variant="secondary" size="sm" onClick={handlePasswordReset} disabled={resetLoading}>
                    {resetLoading ? 'Sending...' : 'Reset password'}
                  </Button>
            }
          />
        </Section>

        <Section icon={Building} title="Organization">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>Organization name</p>
                {editingOrg ? (
                  <input value={orgName} onChange={e => setOrgName(e.target.value)} autoFocus
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--aqua)', color: 'var(--text)' }}
                  />
                ) : (
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{orgName || 'Your Company'}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {editingOrg ? (
                  <>
                    <Button variant="primary" size="sm" onClick={handleSaveOrg} disabled={orgSaving}>
                      {orgSaving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingOrg(false)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setEditingOrg(true)}>
                    {orgSaved ? <><Check size={12} /> Saved</> : 'Edit'}
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Row
            label="Team members"
            description="Multi-user access coming in V2"
            action={<span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>Coming soon</span>}
          />
        </Section>

        <Section icon={CreditCard} title="Plan & Billing">
          {activePlan ? (
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {PLANS.find(p => p.key === activePlan)?.name || activePlan} Plan
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                    {PLANS.find(p => p.key === activePlan)?.volume}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>Active</span>
              </div>
              <Button variant="secondary" size="sm" onClick={handlePortal} disabled={portalLoading}>
                <ExternalLink size={13} />
                {portalLoading ? 'Loading...' : 'Manage billing & invoices'}
              </Button>
            </div>
          ) : (
            <div className="p-5">
              <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>Choose a plan to get started</p>
              <div className="space-y-3">
                {PLANS.map(plan => (
                  <div key={plan.key} className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{plan.name}</p>
                        {plan.key === 'growth' && (
                          <span style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Popular</span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{plan.volume}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {plan.price}<span className="text-xs font-normal" style={{ color: 'var(--text-3)' }}>/mo</span>
                      </span>
                      <Button variant="primary" size="sm" onClick={() => handleCheckout(plan.key)} disabled={checkoutLoading === plan.key}>
                        <Zap size={12} />
                        {checkoutLoading === plan.key ? 'Loading...' : 'Subscribe'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        <div className="pt-2">
          <Button variant="danger" onClick={handleSignOut}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg)', minHeight: '100vh' }} />}>
      <SettingsContent />
    </Suspense>
  )
}
