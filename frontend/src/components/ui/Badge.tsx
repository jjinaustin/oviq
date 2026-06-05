import { cn } from '@/lib/utils'
import { CSSProperties } from 'react'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
}

export function Badge({ children, className, style }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
      className
    )} style={style}>
      {children}
    </span>
  )
}
