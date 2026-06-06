'use client'
import { Sidebar } from './Sidebar'
import { RouteGuard } from '@/components/auth/RouteGuard'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  )
}
