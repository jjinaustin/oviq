'use client'
import { useEffect, useState } from 'react'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const GLYPH = (
  <svg className="glyph" viewBox="0 0 100 100" fill="none" style={{width:14,height:14}}>
    <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="9" strokeLinecap="round" />
    <circle cx="88.6" cy="15.2" r="8.5" />
  </svg>
)

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    open:          { label: 'Open',         cls: 'badge gray' },
    ai_resolving:  { label: 'AI resolving', cls: 'badge teal' },
    pending_human: { label: 'Needs human',  cls: 'badge red' },
    escalated:     { label: 'Escalated',    cls: 'badge red' },
    resolved:      { label: 'Resolved',     cls: 'badge teal' },
    closed:        { label: 'Closed',       cls: 'badge gray' },
  }
  const s = map[status] || { label: status, cls: 'badge gray' }
  return <span className={s.cls}><span className="dot" />{s.label}</span>
}

function OnboardingEmpty({ firstName }: { firstName: string }) {
  const steps = [
    { done: true,  label: 'Create your account', sub: 'You\'re in.' },
    { done: false, label: 'Import your first CSV', sub: 'Export from your TMS and upload it here.', href: '/ingest' },
    { done: false, label: 'Review detected exceptions', sub: 'Oviq will open cases automatically.', href: '/cases' },
    { done: false, label: 'Watch Oviq resolve', sub: 'Carrier emails, customer updates — handled.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: '40px 32px', textAlign: 'center' }}>
      <svg className="glyph" viewBox="0 0 100 100" fill="none" style={{width:44,height:44,marginBottom:20}}>
        <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="8" strokeLinecap="round" />
        <circle cx="88.6" cy="15.2" r="7.6" />
      </svg>
      <h2 style={{fontSize:22,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.02em',marginBottom:8}}>
        Welcome, {firstName}
      </h2>
      <p style={{fontSize:14,color:'var(--body)',maxWidth:400,lineHeight:1.6,marginBottom:36}}>
        Oviq is ready to start resolving exceptions automatically. Import your first CSV to get started.
      </p>

      {/* Checklist */}
      <div style={{width:'100%',maxWidth:440,textAlign:'left',background:'var(--paper)',border:'1px solid var(--line)',borderRadius:16,overflow:'hidden',marginBottom:24}}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display:'flex',alignItems:'flex-start',gap:14,padding:'16px 20px',
            borderBottom: i < steps.length - 1 ? '1px solid var(--line)' : 'none',
            background: s.done ? 'var(--mist)' : 'var(--paper)',
          }}>
            <div style={{
              width:20,height:20,borderRadius:'50%',flexShrink:0,marginTop:2,
              background: s.done ? 'var(--teal)' : 'transparent',
              border: s.done ? 'none' : '2px solid var(--line)',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              {s.done && <svg viewBox="0 0 12 12" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:11,height:11,stroke:'#fff'}}><path d="M2.5 6.3l2.4 2.4L9.6 3.4"/></svg>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:s.done?'var(--teal-deep)':'var(--ink)'}}>{s.label}</div>
              <div style={{fontSize:12.5,color:'var(--faint)',marginTop:2}}>{s.sub}</div>
            </div>
            {s.href && !s.done && (
              <Link href={s.href} className="btn btn-primary btn-sm" style={{flexShrink:0}}>
                {i === 1 ? 'Import CSV' : 'View'}
              </Link>
            )}
          </div>
        ))}
      </div>

      <p style={{fontSize:13,color:'var(--faint)'}}>
        Don't have a CSV ready?{' '}
        <Link href="/ingest" style={{color:'var(--teal-deep)',fontWeight:600}}>Download a sample file →</Link>
      </p>
    </div>
  )
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
  const critical  = cases.filter(c => ['open','escalated','pending_human'].includes(c.status))
  const resolving = cases.filter(c => c.status === 'ai_resolving')
  const resolved  = cases.filter(c => c.status === 'resolved')
  const totalOpen = cases.filter(c => !['resolved','closed'].includes(c.status))

  return (
    <DashboardShell>
      <header className="topbar">
        <div>
          <h1>{getGreeting()}, {firstName}</h1>
          <div className="sub">
            {loading ? '—' : cases.length === 0
              ? 'No shipments yet — connect your TMS to get started'
              : `${totalOpen.length} open · ${resolved.length} resolved today`
            }
          </div>
        </div>
        <div className="topbar-right">
          {resolving.length > 0 && <span className="status-pill"><span className="dot" /> {resolving.length} auto-resolving</span>}
          <Link href="/ingest" className="btn btn-primary btn-sm">Import shipments</Link>
        </div>
      </header>

      <div className="content">
        {!loading && cases.length === 0 ? (
          <OnboardingEmpty firstName={firstName} />
        ) : (
          <>
            {/* Stats */}
            <div className="stat-row">
              <div className="stat">
                <div className="l"><span className="dot" style={{background:'var(--amber)'}} /> Needs judgment</div>
                <div className="v">{loading ? '—' : critical.length}</div>
                <div className={`d ${critical.length > 0 ? 'amber' : ''}`}>{critical.length > 0 ? `${critical.length} open` : 'all clear'}</div>
              </div>
              <div className="stat">
                <div className="l"><span className="dot" style={{background:'var(--teal)'}} /> Auto-resolving</div>
                <div className="v">{loading ? '—' : resolving.length}</div>
                <div className="d">on track</div>
              </div>
              <div className="stat">
                <div className="l"><span className="dot" style={{background:'var(--teal-deep)'}} /> Handled today</div>
                <div className="v">{loading ? '—' : resolved.length}</div>
                <div className="d">resolved</div>
              </div>
              <div className="stat">
                <div className="l"><span className="dot" style={{background:'var(--faint)'}} /> Total open</div>
                <div className="v">{loading ? '—' : totalOpen.length}</div>
                <div className="d">in motion</div>
              </div>
            </div>

            <div className="cols">
              <div className="col-main">
                {/* Needs judgment */}
                {critical.length > 0 && (
                  <>
                    <div className="sec-head" style={{marginTop:24}}>
                      <div className="t">Needs your judgment <span className="badge amber">{critical.length}</span></div>
                      <Link href="/cases" className="link">View all</Link>
                    </div>
                    <div className="needs">
                      {critical.slice(0,3).map(c => (
                        <div key={c.id} className="need">
                          <div className="top">
                            <div style={{flex:1}}>
                              <div className="ttl">
                                <span className="x">{c.title}</span>
                                <span className="id">{(c as any).shipment_ref || c.id.slice(0,8)}</span>
                              </div>
                              <div className="ctx">{(c as any).exception_type?.replace(/_/g,' ')} — review and resolve</div>
                            </div>
                            <span className="badge red"><span className="dot" />{c.status === 'escalated' ? 'Escalated' : 'Needs human'}</span>
                          </div>
                          <div className="acts">
                            <button className="btn btn-primary btn-sm" onClick={() => router.push(`/cases/${c.id}`)}>
                              Review &amp; resolve
                            </button>
                            <span className="ago">{timeAgo(c.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* AI resolving */}
                {resolving.length > 0 && (
                  <>
                    <div className="sec-head" style={{marginTop:24}}>
                      <div className="t">{GLYPH} Oviq resolving <span className="badge teal">{resolving.length}</span></div>
                      <Link href="/cases?filter=ai_resolving" className="link">View all</Link>
                    </div>
                    <div className="panel">
                      <table className="tbl">
                        <thead><tr><th>Case</th><th>Status</th><th>Opened</th></tr></thead>
                        <tbody>
                          {resolving.slice(0,5).map(c => (
                            <tr key={c.id} style={{cursor:'pointer'}} onClick={() => router.push(`/cases/${c.id}`)}>
                              <td>
                                <div className="strong">{c.title}</div>
                                <div className="dim">{(c as any).exception_type?.replace(/_/g,' ')} · <span className="id">{(c as any).shipment_ref || c.id.slice(0,8)}</span></div>
                              </td>
                              <td>{statusBadge(c.status)}</td>
                              <td className="dim">{timeAgo(c.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {!loading && cases.length > 0 && critical.length === 0 && resolving.length === 0 && (
                  <div style={{textAlign:'center',padding:'48px 0'}}>
                    <div style={{width:44,height:44,borderRadius:'50%',background:'var(--mist)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20,stroke:'var(--teal)'}}><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p style={{fontSize:15,fontWeight:600,color:'var(--ink)'}}>All caught up</p>
                    <p style={{fontSize:13,color:'var(--body)',marginTop:4}}>No exceptions require attention right now</p>
                  </div>
                )}
              </div>

              {/* Rail */}
              <div className="col-rail">
                <div className="dark-card">
                  <div className="h">{GLYPH} Oviq is handling it</div>
                  <p>
                    {resolving.length > 0
                      ? `${resolving.length} exception${resolving.length > 1 ? 's are' : ' is'} being resolved automatically. You'll only be notified if something needs your judgment.`
                      : 'All exceptions are being monitored. When something needs attention, it will appear here immediately.'
                    }
                  </p>
                </div>

                {cases.length > 0 && (
                  <div className="feed">
                    <div className="feed-head">
                      <span className="t">Recent activity</span>
                      <span className="n">{cases.length} total</span>
                    </div>
                    {cases.slice(0,6).map(c => (
                      <div key={c.id} className="feed-row" onClick={() => router.push(`/cases/${c.id}`)}>
                        <span className={`d ${['open','escalated','pending_human'].includes(c.status) ? 'amber' : c.status === 'escalated' ? 'red' : ''}`} />
                        <span className="x">{c.title}</span>
                        <span className="id">{(c as any).shipment_ref || c.id.slice(0,8)}</span>
                        <span className="time">{timeAgo(c.created_at).replace(' ago','')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
