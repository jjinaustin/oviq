'use client'
import { useEffect, useState } from 'react'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { CaseRow } from '@/components/cases/CaseRow'
import { AlertTriangle, CheckCircle, FolderOpen, ArrowRight } from 'lucide-react'
import { OviqMark } from '@/components/ui/OviqMark'
import { Sidebar } from '@/components/layout/Sidebar'
import { RouteGuard } from '@/components/auth/RouteGuard'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'

function OnboardingEmpty() {
  const { user } = useAuth()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-20 px-8 text-center">
      <OviqMark size={48} />
      <h2 className="text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
        Welcome, {firstName}
      </h2>
      <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-3)' }}>
        Oviq is ready to start resolving your shipment exceptions automatically. Import your first CSV to get started.
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-2xl w-full mb-8">
        {[
          { step: '01', label: 'Import shipments', desc: 'Upload a CSV export from your TMS' },
          { step: '02', label: 'Exceptions detected', desc: 'Oviq identifies problems automatically' },
          { step: '03', label: 'AI resolves', desc: 'Cases opened, emails sent, escalation handled' },
        ].map(({ step, label, desc }) => (
          <div key={step} className="rounded-xl border p-5 text-left"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-xs font-bold mb-3 font-mono" style={{ color: 'var(--aqua)' }}>{step}</p>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>{label}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{desc}</p>
          </div>
        ))}
      </div>
      <Link href="/ingest"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
        style={{ background: 'var(--aqua)', color: 'var(--slate-dark)' }}>
        Import your first CSV <ArrowRight size={15} />
      </Link>
    </div>
  )
}

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
    { label: 'Needs attention',  value: critical.length,  color: 'var(--danger)', bg: 'rgba(224,80,80,0.08)', icon: AlertTriangle },
    { label: 'Oviq resolving',   value: resolving.length, color: 'var(--aqua)',   bg: 'var(--aqua-dim)',      icon: null },
    { label: 'Resolved today',   value: resolved.length,  color: 'var(--aqua)',   bg: 'var(--aqua-dim)',      icon: CheckCircle },
    { label: 'Total open',       value: totalOpen.length, color: 'var(--text-2)', bg: 'rgba(122,143,168,0.08)', icon: FolderOpen },
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
        <main className="flex-1 overflow-auto">
          {!loading && cases.length === 0 ? <OnboardingEmpty /> : (
            <div className="p-8">
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
                        {Icon ? <Icon size={14} style={{ color }} /> : <OviqMark size={16} />}
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
              {!loading && cases.length > 0 && critical.length === 0 && resolving.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'var(--aqua-dim)', border: '1px solid rgba(39,201,182,0.25)' }}>
                    <CheckCircle size={20} style={{ color: 'var(--aqua)' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>All caught up</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>No exceptions require attention right now</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </RouteGuard>
  )
}
