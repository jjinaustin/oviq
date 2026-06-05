import { CasePriority, CaseStatus } from '@/types'
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/lib/utils'

export function StatusBadge({ status }: { status: CaseStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      {cfg.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: CasePriority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      <span style={{ color: cfg.color }}>{cfg.label}</span>
    </span>
  )
}
