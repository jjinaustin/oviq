'use client'
import { useState } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { User, Building, CreditCard, LogOut, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

function Section({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) {
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

function Row({ label, description, action }: { label: string, description?: string, action: React.ReactNode }) {
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

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [editingOrg, setEditingOrg] = useState(false)
  const [orgName, setOrgName] = useState(user?.user_metadata?.company_name || '')
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgSaved, setOrgSaved] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

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

  return (
    <DashboardShell>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Manage your account and organization</p>
        </div>

        <Section icon={User} title="Account">
          <Row
            label={user?.user_metadata?.full_name || 'Your Name'}
            description={user?.email}
            action={
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>Admin</span>
            }
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
                  <input
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    autoFocus
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
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Growth Plan</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Up to 5,000 loads / month · $799/mo</p>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>Active</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Billing management via Stripe coming soon. Contact{' '}
              <a href="mailto:hello@oviq.io" style={{ color: 'var(--aqua)' }}>hello@oviq.io</a>
              {' '}to make changes.
            </p>
          </div>
        </Section>

        {showCancelConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="rounded-xl border p-6 max-w-sm w-full mx-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>Cancel subscription?</h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Your account stays active until end of billing period. Email us to confirm cancellation.</p>
              <div className="flex gap-3">
                <a href="mailto:hello@oviq.io?subject=Cancel subscription" className="flex-1">
                  <Button variant="danger" size="sm" className="w-full">Email to cancel</Button>
                </a>
                <Button variant="secondary" size="sm" onClick={() => setShowCancelConfirm(false)}>Keep plan</Button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button variant="danger" onClick={handleSignOut}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
}
