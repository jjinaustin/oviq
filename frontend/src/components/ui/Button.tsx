import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className, children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-md transition-colors disabled:opacity-40 cursor-pointer'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }

  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: 'var(--aqua)', color: 'var(--slate-dark)', fontWeight: 600 },
    secondary: { background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text)' },
    ghost:     { background: 'transparent', color: 'var(--text-2)' },
    danger:    { background: 'rgba(224,80,80,0.1)', border: '1px solid rgba(224,80,80,0.3)', color: 'var(--danger)' },
  }

  return (
    <button
      className={cn(base, sizes[size], className)}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  )
}
