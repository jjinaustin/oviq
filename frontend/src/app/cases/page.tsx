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
    open:          { label: 'Open',         cls: 'badge gray' },
    ai_resolving:  { label: 'AI resolving', cls: 'badge teal' },
    pending_human: { label: 'Needs human',  cls: 'badge amber' },
    escalated:     { label: 'Escalated',    cls: 'badge red' },
    resolved:      { label: 'Resolved',     cls: 'badge teal' },
    closed:        { label: 'Closed',       cls: 'badge gray' },
  }
  const s = map[status] || { label: status, cls: 'badge gray' }
  return <span className={s.cls}><span className="dot" />{s.label}</span>
}

function priorityBadge(priority: string) {
  if (!priority) return null
  // SEV-1 = critical, SEV-2 = high, SEV-3 = medium/low
  const map: Record<string, string> = {
    critical: 'badge red',
    high:     'badge amber',
    medium:   'badge gray',
    low:      'badge gray',
  }
  const labels: Record<string, string> = {
    critical: 'SEV-1',
    high:     'SEV-2',
    medium:   'SEV-3',
    low:      'SEV-3',
  }
  return <span className={map[priority] || 'badge gray'}>{labels[priority] || priority.toUpperCase()}</span>
}

function timeAgo(dateStr: string) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const GLYPH = (
  <svg className="glyph" viewBox="0 0 100 100" fill="none" style={{width:14,height:14}}>
    <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="9" strokeLinecap="round" />
    <circle cx="88.6" cy="15.2" r="8.5" />
  </svg>
)

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
          {aiResolving > 0 && <span className="status-pill"><span className="dot" /> {aiResolving} auto-resolving</span>}
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
                {cases.map(c => {
                  const isAI = (c.assigned_to === 'ai' || !c.assigned_to) && (c.status === 'ai_resolving' || c.status === 'open' || c.status === 'resolved')
                  const name = c.assigned_to && c.assigned_to !== 'ai'
                    ? c.assigned_to
                    : isAI ? 'Oviq' : null
                  const initials = name && name !== 'Oviq' ? name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() : null

                  return (
                    <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/cases/${c.id}`)}>
                      <td>
                        <div className="strong">{c.title}</div>
                        <div className="dim">{(c as any).exception_type?.replace(/_/g, ' ') || c.status?.replace(/_/g, ' ')} · <span className="id">{(c as any).shipment_ref || (c.shipments as any)?.load_id || c.id.slice(0,8)}</span></div>
                      </td>
                      <td>{statusBadge(c.status)}</td>
                      <td>{priorityBadge(c.priority)}</td>
                      <td>
                        <span className="assigned">
                          {isAI
                            ? <><span className="a-ai">{GLYPH}</span> Oviq</>
                            : name
                              ? <><span className="a-h">{initials}</span> {name.split(' ')[0]} {name.split(' ')[1] ? name.split(' ')[1][0] + '.' : ''}</>
                              : <span style={{color:'var(--faint)',fontSize:13}}>—</span>
                          }
                        </span>
                      </td>
                      <td className="dim">{timeAgo(c.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
