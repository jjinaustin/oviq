'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Truck, Upload, Settings, LogOut } from 'lucide-react'
import { OviqMark } from '@/components/ui/OviqMark'
import { useAuth } from '@/components/auth/AuthProvider'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/cases',      label: 'Cases',      icon: FolderOpen },
  { href: '/shipments',  label: 'Shipments',  icon: Truck },
  { href: '/ingest',     label: 'Import',     icon: Upload },
  { href: '/settings',   label: 'Settings',   icon: Settings },
]

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <aside className="w-56 flex flex-col border-r shrink-0" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <OviqMark size={28} />
          <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>
            Oviq
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors no-underline"
              style={{
                color: active ? 'var(--aqua)' : 'var(--text-2)',
                background: active ? 'var(--aqua-dim)' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md" style={{ background: 'var(--surface-2)' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={{ background: 'var(--aqua-dim)', color: 'var(--aqua)', border: '1px solid rgba(39,201,182,0.25)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="shrink-0" style={{ color: 'var(--text-3)' }} title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
