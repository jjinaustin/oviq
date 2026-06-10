import Link from 'next/link'
import { OviqMark } from '@/components/ui/OviqMark'

export function MarketingFooter() {
  return (
    <footer className="flex items-center justify-between flex-wrap gap-4 px-12 py-8 border-t"
      style={{ borderColor: 'var(--border)' }}>
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <OviqMark size={22} />
        <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>
          Oviq
        </span>
      </Link>
      <div className="flex gap-8">
        {[
          { href: '/product', label: 'Product' },
          { href: '/pricing', label: 'Pricing' },
          { href: '/contact', label: 'Contact' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/terms', label: 'Terms' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="text-xs no-underline transition-colors"
            style={{ color: 'var(--text-3)' }}>
            {label}
          </Link>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'var(--text-3)' }}>© 2026 Oviq. All rights reserved.</p>
    </footer>
  )
}
