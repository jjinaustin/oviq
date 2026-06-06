'use client'
import { useEffect, useState } from 'react'
import { Case, CaseStatus } from '@/types'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { CaseRow } from '@/components/cases/CaseRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderOpen } from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'

const FILTERS: { label: string; value: CaseStatus | 'all' }[] = [
  { label: 'All',          value: 'all' },
  { label: 'Open',         value: 'open' },
  { label: 'AI Resolving', value: 'ai_resolving' },
  { label: 'Needs Human',  value: 'pending_human' },
  { label: 'Escalated',    value: 'escalated' },
  { label: 'Resolved',     value: 'resolved' },
]

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    setLoading(true)
    api.cases.list(params).then(setCases).finally(() => setLoading(false))
  }, [filter])

  return (
    <DashboardShell>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Cases</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {loading ? '—' : cases.length} cases
          </p>
        </div>
        <div className="flex gap-2 mb-5">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: filter === f.value ? 'var(--surface-2)' : 'transparent',
                color: filter === f.value ? 'var(--text)' : 'var(--text-3)',
                border: `1px solid ${filter === f.value ? 'var(--border-2)' : 'transparent'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <Card>
          {cases.length === 0 && !loading ? (
            <EmptyState icon={FolderOpen} title="No cases found" description="Adjust the filter or import shipments" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
                  {['Case', 'Status', 'Priority', 'Assigned', 'Opened'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map(c => <CaseRow key={c.id} c={c} />)}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </DashboardShell>
  )
}
