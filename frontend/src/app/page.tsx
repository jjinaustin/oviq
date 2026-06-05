'use client'
import { useEffect, useState } from 'react'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { CaseRow } from '@/components/cases/CaseRow'
import { AlertTriangle, CheckCircle, FolderOpen } from 'lucide-react'
import { OviqMark } from '@/components/ui/OviqMark'
import { Sidebar } from '@/components/layout/Sidebar'
import { RouteGuard } from '@/components/auth/RouteGuard'

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.cases.list().then(setCases).finally(() => setLoading(false))
  }, [])

  const critical  = cases.filter(c => ['open', 'escalated', 'pending_human'].includes(c.status))
  const resolving = cases.filter(c => c.status === 'ai_resolving')
  const resolved  = cases.filter(c => c.status === 'resolved')
  const totalOpen = cases.filter(c => !['resolved', 'closed'].includes(c.status))

  const stats = [
    { label: 'Needs attention',  value: critical.length,   color: 'var(--danger)',  bg: 'rgba(224,80,80,0.08)',    icon: AlertTriangle },
    { label: 'Oviq resolving',   value: resolving.length,  color: 'var(--aqua)',    bg: 'var(--aqua-dim)',         icon: null },
    { label: 'Resolved today',   value: resolved.length,   color: 'var(--aqua)',    bg: 'var(--aqua-dim)',         icon: CheckCircle },
    { label: 'Total open',       value: totalOpen.length,  color: 'var(--text-2)',  bg: 'rgba(122,143,168,0.08)',  icon: FolderOpen },
  ]

  const tableHead = (
    <thead>
      <tr className="border-b text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
        {['Case', 'Status', 'Priority', 'Assigned', 'Opened'].map(h => (
          <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
        ))}
      </tr>
    </thead>
  )

  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">
          <div className="mb-8">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Operations</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>Exception management overview</p>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="rounded-xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    {Icon ? <Icon size={14} style={{ color }} /> : <OviqMark size={16} color={color} />}
                  </div>
                </div>
                <p className="text-2xl font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
                  {loading ? '—' : value}
                </p>
              </div>
            ))}
          </div>
          {critical.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} style={{ color: 'var(--danger)' }} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--danger)' }}>Requires human action</h2>
              </div>
              <Card><table className="w-full">{tableHead}<tbody>{critical.map(c => <CaseRow key={c.id} c={c} />)}</tbody></table></Card>
            </div>
          )}
          {resolving.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <OviqMark size={14} />
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--aqua)' }}>Oviq resolving automatically</h2>
              </div>
              <Card><table className="w-full">{tableHead}<tbody>{resolving.map(c => <CaseRow key={c.id} c={c} />)}</tbody></table></Card>
            </div>
          )}
          {!loading && cases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <OviqMark size={40} color="var(--text-3)" />
              <p className="text-sm font-medium mt-4" style={{ color: 'var(--text-2)' }}>No cases yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Import shipments to start detecting exceptions</p>
            </div>
          )}
        </main>
      </div>
    </RouteGuard>
  )
}
