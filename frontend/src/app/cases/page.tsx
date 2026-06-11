'use client'
import { useEffect, useState } from 'react'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'AI Resolving', value: 'ai_resolving' },
  { label: 'Needs Human', value: 'pending_human' },
  { label: 'Escalated', value: 'escalated' },
  { label: 'Resolved', value: 'resolved' },
]

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    open:          { label: 'Open',          cls: 'badge amber' },
    ai_resolving:  { label: 'AI resolving',  cls: 'badge teal' },
    pending_human: { label: 'Needs human',   cls: 'badge red' },
    escalated:     { label: 'Escalated',     cls: 'badge red' },
    resolved:      { label: 'Resolved',      cls: 'badge gray' },
    closed:        { label: 'Closed',        cls: 'badge gray' },
  }
  const s = map[status] || { label: status, cls: 'badge gray' }
  return <span className={s.cls}><span className="dot"></span> {s.label}</span>
}

function priorityBadge(p: string) {
  if (!p) return <span className="badge gray">—</span>
  const map: Record<string, string> = { critical: 'badge red', high: 'badge amber', medium: 'badge amber', low: 'badge gray' }
  return <span className={map[p] || 'badge gray'}>{p.toUpperCase()}</span>
}

export default function CasesPage() {
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    setLoading(true)
    api.cases.list(params).then(setCases).finally(() => setLoading(false))
  }, [filter])

  const needHuman = cases.filter(c => ['open','escalated','pending_human'].includes(c.status)).length
  const aiResolving = cases.filter(c => c.status === 'ai_resolving').length

  return (
    <DashboardShell>
      <header className="topbar">
        <div>
          <h1>Cases</h1>
          <div className="sub">{loading ? '—' : cases.length} cases · {needHuman} need your judgment</div>
        </div>
        <div className="topbar-right">
          {aiResolving > 0 && <span className="status-pill"><span className="dot"></span> {aiResolving} auto-resolving</span>}
          <Link href="/ingest" className="btn btn-primary btn-sm">Import shipments</Link>
        </div>
      </header>

      <div className="content">
        <div className="chips">
          {FILTERS.map(f => (
            <button key={f.value} className={`chip ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="panel">
          {cases.length === 0 && !loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--body)', fontSize: 14 }}>No cases found.</p>
              <p style={{ color: 'var(--faint)', fontSize: 13, marginTop: 6 }}>
                {filter === 'all' ? 'Import shipments to start detecting exceptions.' : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                  <th>Opened</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/cases/${c.id}`)}>
                    <td>
                      <div className="strong">{c.title}</div>
                      <div className="dim">{((c as any).exception_type)?.replace(/_/g, ' ')} · <span className="id">{c.id.slice(0,8)}</span></div>
                    </td>
                    <td>{statusBadge(c.status)}</td>
                    <td>{priorityBadge(c.priority)}</td>
                    <td>
                      <span className="assigned">
                        {c.assigned_to === 'ai'
                          ? <><span className="a-ai"><svg className="glyph" viewBox="0 0 100 100" fill="none"><path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="9" strokeLinecap="round"/><circle cx="88.6" cy="15.2" r="8.5"/></svg></span> Oviq</>
                          : <><span className="a-h">H</span> {c.assigned_to || 'Unassigned'}</>
                        }
                      </span>
                    </td>
                    <td className="dim">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
