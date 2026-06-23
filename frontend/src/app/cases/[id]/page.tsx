'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { DashboardShell } from '@/components/layout/DashboardShell'

const GLYPH_SM = (
  <svg className="glyph" viewBox="0 0 100 100" fill="none" style={{width:13,height:13}}>
    <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="9" strokeLinecap="round" />
    <circle cx="88.6" cy="15.2" r="8.5" />
  </svg>
)

const GLYPH_MD = (
  <svg className="glyph" viewBox="0 0 100 100" fill="none" style={{width:16,height:16}}>
    <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="8" strokeLinecap="round" />
    <circle cx="88.6" cy="15.2" r="7.6" />
  </svg>
)

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

function priorityBadge(priority: string) {
  if (!priority) return null
  const map: Record<string, string> = { critical: 'badge red', high: 'badge red', medium: 'badge gray', low: 'badge gray' }
  const labels: Record<string, string> = { critical: 'SEV-1', high: 'SEV-2', medium: 'SEV-3', low: 'SEV-3' }
  return <span className={map[priority] || 'badge gray'}>{labels[priority] || priority.toUpperCase()}</span>
}

export default function CaseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [c, setCase] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) api.cases.get(id as string).then(setCase).finally(() => setLoading(false))
  }, [id])

  if (loading) return <DashboardShell><header className="topbar"><div><h1>Loading…</h1></div></header><div className="content" /></DashboardShell>
  if (!c) return <DashboardShell><header className="topbar"><div><h1>Case not found</h1></div></header><div className="content" /></DashboardShell>

  const shipment = c.shipments
  const events = c.events || []
  const exceptions = c.exceptions || []
  const tasks = c.tasks || []
  const comms = c.communications || []
  const aiActions = c.ai_actions || []
  const isAI = c.status === 'ai_resolving'
  const assigneeName = c.assigned_to && c.assigned_to !== 'ai' ? c.assigned_to : null
  const assigneeInitials = assigneeName ? assigneeName.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase() : null

  return (
    <DashboardShell>
      <header className="topbar">
        <button className="back" onClick={() => router.back()}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:15,height:15,stroke:'currentColor'}}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Cases
        </button>
        <div className="topbar-right">
          {isAI && <span className="status-pill"><span className="dot" /> Oviq is resolving this</span>}
          {c.status !== 'resolved' && c.status !== 'closed' && (
            <button className="btn btn-primary btn-sm" onClick={async () => {
              await api.cases.resolve(c.id, 'Manually resolved')
              setCase({ ...c, status: 'resolved' })
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><polyline points="20 6 9 17 4 12"/></svg>
              Mark resolved
            </button>
          )}
        </div>
      </header>

      <div className="content">
        <div className="case-wrap">
          <div className="case-head">
            <div>
              <h2>{c.title}</h2>
              <div className="case-meta">
                {statusBadge(c.status)}
                {priorityBadge(c.priority)}
                <span className="case-assigned">
                  {isAI
                    ? <><span className="a-ai">{GLYPH_SM}</span> Assigned to Oviq</>
                    : assigneeName
                  }
                </span>
                <span className="mono" style={{fontSize:12,color:'var(--faint)'}}>
                  #{(c as any).shipment_ref || c.id.slice(0,8)} · opened {c.created_at ? new Date(c.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="case-grid">
            {/* LEFT */}
            <div className="case-col">

              {/* Timeline */}
              {events.length > 0 && (
                <div className="case-card">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Timeline
                  </h3>
                  <div className="tl">
                    {events.map((ev, i) => (
                      <div key={ev.id || i} className="tl-item">
                        <div className="tl-mark">
                          <span className={`d ${ev.actor === 'ai' || ev.actor === 'system' ? '' : 'gray'}`} />
                          {i < events.length - 1 && <span className="line" />}
                        </div>
                        <div className="tl-body">
                          <div className="t">{(ev as any).description || ev.event_type?.replace(/_/g,' ')}</div>
                          <div className="meta">
                            {ev.created_at ? new Date(ev.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                            {ev.actor === 'ai' && (
                              <span className="mini-ai">
                                {GLYPH_SM} Oviq
                              </span>
                            )}
                            {(ev as any).pending && <> · pending</>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Communications */}
              {comms.length > 0 && (
                <div className="case-card">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                    Communications
                  </h3>
                  {comms.map(m => (
                    <div key={m.id} className="comm">
                      <div className="ch">
                        <span className="subj">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:13,height:13,stroke:'var(--faint)',flexShrink:0}}><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></svg>
                          {m.subject || '(no subject)'}
                        </span>
                        <span className="who">{m.participant_type}</span>
                      </div>
                      <div className="body">{m.body}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {tasks.length > 0 && (
                <div className="case-card">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Tasks
                  </h3>
                  {tasks.map(t => {
                    const taskOwner = t.owner
                    const isAITask = taskOwner === 'ai'
                    const ownerInitials = !isAITask && taskOwner ? taskOwner.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase() : null
                    return (
                      <div key={t.id} className="task">
                        <span className={`d ${t.status === 'completed' ? 'done' : t.status === 'failed' ? 'failed' : 'pending'}`} />
                        <span className="t">{t.title}</span>
                        <span className={`own ${isAITask ? 'ai' : ''}`}>
                          {isAITask
                            ? <>{GLYPH_SM} Oviq</>
                            : <><svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:12,height:12,stroke:'currentColor'}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {taskOwner}</>
                          }
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="case-col">

              {/* Shipment */}
              {shipment && (
                <div className="case-card">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                    Shipment
                  </h3>
                  {[
                    ['Load ID', shipment.load_id],
                    ['Customer', shipment.customer_name],
                    ['Carrier', shipment.carrier_name],
                    ['Origin', shipment.origin],
                    ['Destination', shipment.destination],
                    ['Pickup', shipment.pickup_scheduled ? new Date(shipment.pickup_scheduled).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}) : '—'],
                    ['Delivery', shipment.delivery_scheduled ? new Date(shipment.delivery_scheduled).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}) : '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="mrow">
                      <span className="k">{k}</span>
                      <span className="v">{v || '—'}</span>
                    </div>
                  ))}
                  <div className="mrow bd">
                    <span className="k">Status</span>
                    <span className="v">
                      <span className="badge red" style={{fontSize:11}}>
                        <span className="dot" /> {shipment.status === 'exception' || exceptions.length > 0 ? 'Exception' : shipment.status}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* Exceptions */}
              {exceptions.length > 0 && (
                <div className="case-card">
                  <h3>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Exceptions
                  </h3>
                  {exceptions.map(ex => (
                    <div key={ex.id} className="mrow">
                      <span className="k" style={{color:'var(--ink)'}}>{(ex.exception_type||'').replace(/_/g,' ')}</span>
                      <span className="v" style={{color: ex.resolved ? 'var(--teal-deep)' : 'var(--amber)'}}>{ex.resolved ? 'Resolved' : 'Active'}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Actions */}
              {aiActions.length > 0 && (
                <div className="case-card">
                  <h3>{GLYPH_MD} AI actions</h3>
                  {aiActions.map(a => (
                    <div key={a.id} className="aia">
                      <div className="r">
                        <span className="nm">{a.action_type?.replace(/_/g,' ')}</span>
                        <span className={`st ${a.status === 'executed' ? 'ok' : a.status === 'failed' ? 'failed' : 'pending'}`}>
                          {a.status === 'executed' ? 'Executed' : a.status === 'failed' ? 'Failed' : 'Pending'}
                        </span>
                      </div>
                      <div className="conf">
                        <i style={{width: a.confidence_score ? `${Math.round(a.confidence_score * 100)}%` : a.status === 'executed' ? '90%' : '60%'}} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
