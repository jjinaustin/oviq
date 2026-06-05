import { OviqMark } from '@/components/ui/OviqMark'
import Link from 'next/link'

export function AuthLayout({ children, title, subtitle, footerText, footerLink, footerHref }: {
  children: React.ReactNode
  title: string
  subtitle: string
  footerText: string
  footerLink: string
  footerHref: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <OviqMark size={30} />
          <span style={{
            fontFamily: "'Hanken Grotesk', sans-serif",
            fontSize: '20px', fontWeight: 700,
            letterSpacing: '-0.025em', color: 'var(--text)',
          }}>Oviq</span>
        </div>
        <div className="rounded-xl border p-8" style={{
          background: 'var(--surface)', borderColor: 'var(--border)',
        }}>
          <h1 className="text-lg font-semibold mb-1" style={{
            color: 'var(--text)', letterSpacing: '-0.02em',
          }}>{title}</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>{subtitle}</p>
          {children}
        </div>
        <p className="text-center text-sm mt-5" style={{ color: 'var(--text-3)' }}>
          {footerText}{' '}
          <Link href={footerHref} style={{ color: 'var(--aqua)' }}>{footerLink}</Link>
        </p>
      </div>
    </div>
  )
}
