'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Truck, Upload, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OviqMark } from '@/components/ui/OviqMark'

const nav = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/cases',     label: 'Cases',      icon: FolderOpen },
  { href: '/shipments', label: 'Shipments',  icon: Truck },
  { href: '/ingest',    label: 'Import',     icon: Upload },
  { href: '/settings',  label: 'Settings',   icon: Settings },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 flex flex-col border-r shrink-0" style={{
      background: 'var(--surface)',
      borderColor: 'var(--border)',
    }}>
      {/* Wordmark */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <OviqMark size={28} />
          <span style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--text)',
          }}>
            Oviq
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
              style={{
                color: active ? 'var(--aqua)' : 'var(--text-2)',
                background: active ? 'var(--aqua-dim)' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs mono" style={{ color: 'var(--text-3)' }}>v0.1.0</p>
      </div>
    </aside>
  )
}
