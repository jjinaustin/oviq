'use client'
import { useRouter } from 'next/navigation'
import { Case } from '@/types'
import { StatusBadge, PriorityBadge } from './CaseBadge'
import { EXCEPTION_LABELS, timeAgo } from '@/lib/utils'
import { OviqMark } from '@/components/ui/OviqMark'
import { User } from 'lucide-react'

export function CaseRow({ c }: { c: Case }) {
  const router = useRouter()
  const exTypes = (c.exceptions || []).map(e => EXCEPTION_LABELS[e.exception_type] || e.exception_type)

  return (
    <tr
      onClick={() => router.push(`/cases/${c.id}`)}
      className="border-b cursor-pointer transition-colors"
      style={{ borderColor: 'var(--border)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td className="px-5 py-3.5">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{c.title}</p>
        <p className="text-xs mt-0.5 mono" style={{ color: 'var(--text-3)' }}>
          {exTypes.join(' · ') || 'No exceptions'}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={c.status} />
      </td>
      <td className="px-4 py-3.5">
        <PriorityBadge priority={c.priority} />
      </td>
      <td className="px-4 py-3.5">
        {c.assigned_to === 'ai'
          ? <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--aqua)' }}>
              <OviqMark size={12} /> Oviq AI
            </span>
          : <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
              <User size={11} /> {c.assigned_to || '—'}
            </span>
        }
      </td>
      <td className="px-4 py-3.5 text-xs mono" style={{ color: 'var(--text-3)' }}>
        {timeAgo(c.opened_at)}
      </td>
    </tr>
  )
}
