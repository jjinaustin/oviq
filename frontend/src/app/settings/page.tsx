'use client'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { User, Building, CreditCard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <DashboardShell>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Manage your account and organization</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <User size={14} style={{ color: 'var(--text-3)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Account</h2>
          </div>
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {user?.user_metadata?.full_name || 'Your Name'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{user?.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>
                Admin
              </span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Password</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Change your password</p>
              </div>
              <Button variant="secondary" size="sm">Update</Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Building size={14} style={{ color: 'var(--text-3)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Organization</h2>
          </div>
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {user?.user_metadata?.company_name || 'Your Company'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Organization name</p>
              </div>
              <Button variant="secondary" size="sm">Edit</Button>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Team members</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Invite and manage your team</p>
              </div>
              <Button variant="secondary" size="sm">Manage</Button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={14} style={{ color: 'var(--text-3)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Plan & Billing</h2>
          </div>
          <div className="rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Growth Plan</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Up to 5,000 loads / month · $799/mo</p>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>
                  Active
                </span>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm">Upgrade plan</Button>
                <Button variant="danger" size="sm">Cancel subscription</Button>
              </div>
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            Contact <a href="mailto:hello@oviq.io" style={{ color: 'var(--aqua)' }}>hello@oviq.io</a> to make billing changes.
          </p>
        </div>

        <Button variant="danger" onClick={handleSignOut}>
          <LogOut size={14} /> Sign out
        </Button>
      </div>
    </DashboardShell>
  )
}
