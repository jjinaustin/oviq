import { cn } from '@/lib/utils'

export function Card({ children, className, onClick }: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn('rounded-xl border', onClick && 'cursor-pointer')}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className={className}>
        {children}
      </div>
    </div>
  )
}
