import { Event } from '@/types'
import { formatDate } from '@/lib/utils'
import { OviqMark } from '@/components/ui/OviqMark'
import { Mail, AlertTriangle, CheckCircle, User, Cpu } from 'lucide-react'

const EVENT_ICONS: Record<string, any> = {
  exception: AlertTriangle,
  carrier:   Mail,
  customer:  Mail,
  case:      CheckCircle,
  human:     User,
}

function getIcon(eventType: string) {
  const prefix = eventType.split('.')[0]
  return EVENT_ICONS[prefix] || Cpu
}

export function CaseTimeline({ events }: { events: Event[] }) {
  if (!events.length) return (
    <p className="text-sm py-8 text-center" style={{ color: 'var(--text-3)' }}>No events yet</p>
  )

  return (
    <div>
      {events.map((e, i) => {
        const isAI = e.actor === 'ai'
        const isLast = i === events.length - 1
        const Icon = getIcon(e.event_type)

        return (
          <div key={e.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border"
                style={{
                  background: isAI ? 'var(--aqua-dim)' : 'var(--surface-2)',
                  borderColor: isAI ? 'rgba(39,201,182,0.25)' : 'var(--border-2)',
                }}>
                {isAI
                  ? <OviqMark size={14} />
                  : <Icon size={12} style={{ color: 'var(--text-3)' }} />
                }
              </div>
              {!isLast && (
                <div className="w-px flex-1 my-1" style={{ background: 'var(--border)' }} />
              )}
            </div>
            <div className="pb-5 pt-0.5 flex-1 min-w-0">
              <p className="text-sm" style={{ color: 'var(--text)' }}>{e.summary}</p>
              <p className="text-xs mt-0.5 mono" style={{ color: 'var(--text-3)' }}>
                {isAI ? 'Oviq AI · ' : ''}{formatDate(e.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
