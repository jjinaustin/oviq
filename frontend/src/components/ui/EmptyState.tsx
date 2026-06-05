import { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, description }: {
  icon: LucideIcon
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--surface-2)' }}>
        <Icon size={20} style={{ color: 'var(--text-3)' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{title}</p>
      {description && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{description}</p>}
    </div>
  )
}
