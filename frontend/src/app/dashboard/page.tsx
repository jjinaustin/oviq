'use client'
import { useEffect, useState } from 'react'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useAuth } from '@/components/auth/AuthProvider'
import { OviqMark, OviqWordmark } from '@/components/ui/OviqMark'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    open:          { label: 'Open',           cls: 'badge amber' },
    ai_resolving:  { label: 'AI resolving',   cls: 'badge teal' },
    pending_human: { label: 'Needs human',    cls: 'badge amber' },
    escalated:     { label: 'Escalated',      cls: 'badge red' },
    resolved:      { label: 'Resolved',       cls: 'badge gray' },
    closed:        { label: 'Closed',         cls: 'badge gray' },
  }
  const s = map[status] || { label: status, cls: 'badge gray' }
  return <span className={s.cls}><span className="dot"></span> {s.label}</span>
}

function priorityBadge(p: string) {
  const map: Record<string, string> = { critical: 'badge red', high: 'badge amber', medium: 'badge amber', low: 'badge gray' }
  if (!p) return null
  return <span className={map[p] || 'badge gray'}>{p.toUpperCase()}</span>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.cases.list().then(setCases).finally(() => setLoading(false))
  }, [])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const critical   = cases.filter(c => ['open','escalated','pending_human'].includes(c.status))
  const resolving  = cases.filter(c => c.status === 'ai_resolving')
  const resolved   = cases.filter(c => c.status === 'resolved')
  const totalOpen  = cases.filter(c => !['resolved','closed'].includes(c.status))

  // Empty onboarding state
  if (!loading && cases.length === 0) {
    return (
      <DashboardShell>
        <header className="topbar">
          <div>
            <h1>{getGreeting()}, {firstName}</h1>
            <div className="sub">{getToday()} · no shipments yet</div>
          </div>
        </header>
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <OviqMark size={44} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', marginBottom: 10 }}>
              Ready to start resolving
            </h2>
            <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.6, marginBottom: 28 }}>
              Import a CSV export from your TMS to detect exceptions automatically. Oviq handles the first 80% — carrier contact, customer notifications, and escalation.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link href="/ingest" className="btn btn-primary">Import shipments</Link>
              <Link href="/product" className="btn btn-ghost">How it works</Link>
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <header className="topbar">
        <div>
          <h1>{getGreeting()}, {firstName}</h1>
          <div className="sub">{getToday()} · {totalOpen.length} shipments in motion</div>
        </div>
        <div className="topbar-right">
          <span className="status-pill"><span className="dot"></span> {resolving.length} auto-resolving</span>
        </div>
      </header>

      <div className="content">
        {/* Stat row */}
        <div className="stat-row">
          <div className="stat">
            <div className="l"><span className="dot" style={{ background: 'var(--amber)' }}></span> Needs your judgment</div>
            <div className="v">{loading ? '—' : critical.length}</div>
            <div className={`d ${critical.length > 0 ? 'amber' : ''}`}>{critical.length > 0 ? `${critical.length} new` : 'all clear'}</div>
          </div>
          <div className="stat">
            <div className="l"><span className="dot" style={{ background: 'var(--teal)' }}></span> Auto-resolving now</div>
            <div className="v">{loading ? '—' : resolving.length}</div>
            <div className="d">on track</div>
          </div>
          <div className="stat">
            <div className="l"><span className="dot" style={{ background: 'var(--teal-deep)' }}></span> Handled today</div>
            <div className="v">{loading ? '—' : resolved.length}</div>
            <div className="d">resolved</div>
          </div>
          <div className="stat">
            <div className="l"><span className="dot" style={{ background: 'var(--faint)' }}></span> Total open</div>
            <div className="v">{loading ? '—' : totalOpen.length}</div>
            <div className="d">in motion</div>
          </div>
        </div>

        <div className="cols">
          <div className="col-main">
            {critical.length > 0 && (
              <>
                <div className="sec-head">
                  <div className="t">
                    Needs your judgment
                    <span className="badge amber">{critical.length}</span>
                  </div>
                  <Link href="/cases" className="link">View all</Link>
                </div>
                <div className="needs">
                  {critical.slice(0, 3).map(c => (
                    <div key={c.id} className="need">
                      <div className="top">
                        <div style={{ flex: 1 }}>
                          <div className="ttl">
                            <span className="x">{c.title}</span>
                            <span className="id">#{c.id.slice(0, 8)}</span>
                          </div>
                          <div className="ctx">{((c as any).description) || `${((c as any).exception_type)?.replace(/_/g, ' ')} — review and resolve`}</div>
                        </div>
                        {statusBadge(c.status)}
                      </div>
                      <div className="acts">
                        <button className="btn btn-primary btn-sm" onClick={() => router.push(`/cases/${c.id}`)}>
                          Review &amp; resolve
                        </button>
                        <span className="ago">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {resolving.length > 0 && (
              <>
                <div className="sec-head" style={{ marginTop: critical.length > 0 ? 24 : 0 }}>
                  <div className="t">
                    <OviqMark size={16} />
                    Oviq resolving
                    <span className="badge teal">{resolving.length}</span>
                  </div>
                  <Link href="/cases?filter=ai_resolving" className="link">View all</Link>
                </div>
                <div className="panel">
                  <table className="tbl">
                    <thead><tr><th>Case</th><th>Status</th><th>Priority</th><th>Opened</th></tr></thead>
                    <tbody>
                      {resolving.slice(0, 5).map(c => (
                        <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/cases/${c.id}`)}>
                          <td>
                            <div className="strong">{c.title}</div>
                            <div className="dim">{((c as any).exception_type)?.replace(/_/g, ' ')} · <span className="id">{c.id.slice(0,8)}</span></div>
                          </td>
                          <td>{statusBadge(c.status)}</td>
                          <td>{priorityBadge(c.priority)}</td>
                          <td className="dim">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!loading && critical.length === 0 && resolving.length === 0 && cases.length > 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>All caught up</p>
                <p style={{ fontSize: 13, color: 'var(--body)', marginTop: 4 }}>No exceptions require attention right now</p>
              </div>
            )}
          </div>

          <div className="col-rail">
            <div className="dark-card">
              <div className="h">
                <OviqMark size={18} className="on-dark" />
                <span>Oviq is handling it</span>
              </div>
              <p>
                {resolving.length > 0
                  ? `${resolving.length} exception${resolving.length > 1 ? 's are' : ' is'} being resolved automatically right now. You'll only be notified if something needs your judgment.`
                  : `All exceptions are being monitored. When something needs attention, it will appear here immediately.`
                }
              </p>
            </div>

            <div className="panel">
              <div className="feed-head">
                <span className="t">Recent activity</span>
                <span className="n">{cases.length} total</span>
              </div>
              {cases.slice(0, 6).map(c => (
                <div key={c.id} className="feed-row" style={{ cursor: 'pointer' }} onClick={() => router.push(`/cases/${c.id}`)}>
                  <span className={`d ${['open','pending_human'].includes(c.status) ? 'amber' : c.status === 'escalated' ? 'red' : ''}`}></span>
                  <span className="x">{c.title}</span>
                  <span className="id">{c.id.slice(0,6)}</span>
                  <span className="time">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
