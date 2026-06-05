'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Case } from '@/types'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/cases/CaseBadge'
import { CaseTimeline } from '@/components/cases/CaseTimeline'
import { EXCEPTION_LABELS, formatDateShort } from '@/lib/utils'
import { ArrowLeft, Bot, Mail, CheckCircle, Truck, User } from 'lucide-react'

export default function CaseDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [c, setCase] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) api.cases.get(id as string).then(setCase).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="p-8 text-sm" style={{ color: 'var(--text-3)' }}>Loading...</div>
  )
  if (!c) return (
    <div className="p-8 text-sm" style={{ color: 'var(--text-3)' }}>Case not found</div>
  )

  const shipment = c.shipments
  const events = c.events || []
  const exceptions = c.exceptions || []
  const tasks = c.tasks || []
  const comms = c.communications || []
  const aiActions = c.ai_actions || []

  return (
    <div className="p-8 max-w-5xl">
      {/* Back + header */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-3)' }}>
        <ArrowLeft size={14} /> Back to Cases
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{c.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            {c.assigned_to === 'ai'
              ? <span className="flex items-center gap-1 text-xs text-violet-400"><Bot size={12} /> Assigned to AI</span>
              : <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}><User size={12} /> {c.assigned_to || 'Unassigned'}</span>
            }
          </div>
        </div>
        {c.status !== 'resolved' && (
          <Button variant="primary" size="sm" onClick={async () => {
            await api.cases.resolve(c.id, 'Manually resolved')
            setCase({ ...c, status: 'resolved' })
          }}>
            <CheckCircle size={14} /> Mark Resolved
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left: timeline */}
        <div className="col-span-2 space-y-5">

          {/* Timeline */}
          <Card className="p-5">
            <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Timeline</h2>
            <CaseTimeline events={events} />
          </Card>

          {/* Communications */}
          {comms.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Communications</h2>
              <div className="space-y-3">
                {comms.map(m => (
                  <div key={m.id} className="rounded-md p-3 border"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Mail size={12} style={{ color: 'var(--text-3)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                          {m.subject || '(no subject)'}
                        </span>
                      </div>
                      <span className="text-xs capitalize px-2 py-0.5 rounded"
                        style={{ background: 'var(--border)', color: 'var(--text-3)' }}>
                        {m.participant_type}
                      </span>
                    </div>
                    <p className="text-xs whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>
                      {m.body}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Tasks</h2>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      t.status === 'completed' ? 'bg-emerald-400' :
                      t.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-sm flex-1" style={{ color: 'var(--text)' }}>{t.title}</span>
                    <span className="text-xs flex items-center gap-1"
                      style={{ color: t.owner === 'ai' ? '#7b5af6' : 'var(--text-3)' }}>
                      {t.owner === 'ai' ? <Bot size={11} /> : <User size={11} />}
                      {t.owner}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: metadata */}
        <div className="space-y-5">

          {/* Shipment */}
          {shipment && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={14} style={{ color: 'var(--text-3)' }} />
                <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>Shipment</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  ['Load ID', shipment.load_id],
                  ['Customer', shipment.customer_name],
                  ['Carrier', shipment.carrier_name],
                  ['Origin', shipment.origin],
                  ['Destination', shipment.destination],
                  ['Pickup', formatDateShort(shipment.pickup_scheduled)],
                  ['Delivery', formatDateShort(shipment.delivery_scheduled)],
                  ['Status', shipment.status],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{label}</span>
                    <span className="text-xs text-right" style={{ color: 'var(--text-2)' }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Exceptions */}
          {exceptions.length > 0 && (
            <Card className="p-5">
              <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Exceptions</h2>
              <div className="space-y-2">
                {exceptions.map(e => (
                  <div key={e.id} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                      {EXCEPTION_LABELS[e.exception_type] || e.exception_type}
                    </span>
                    <span className={`text-xs ${e.resolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {e.resolved ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* AI Actions */}
          {aiActions.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={14} className="text-violet-400" />
                <h2 className="text-sm font-medium" style={{ color: 'var(--text)' }}>AI Actions</h2>
              </div>
              <div className="space-y-2">
                {aiActions.map(a => (
                  <div key={a.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                        {a.action_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs ${
                        a.status === 'executed' ? 'text-emerald-400' :
                        a.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                      }`}>{a.status}</span>
                    </div>
                    {a.confidence_score && (
                      <div className="mt-1 w-full rounded-full h-0.5" style={{ background: 'var(--border)' }}>
                        <div className="h-0.5 rounded-full bg-violet-400"
                          style={{ width: `${a.confidence_score * 100}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
