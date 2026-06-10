'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OviqMark } from '@/components/ui/OviqMark'

export function MarketingNav() {
  const path = usePathname()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-16 border-b"
      style={{ background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(16px)', borderColor: 'var(--border)' }}>
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <OviqMark size={26} />
        <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: '18px', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)' }}>
          Oviq
        </span>
      </Link>
      <div className="flex items-center gap-10">
        {[
          { href: '/product', label: 'Product' },
          { href: '/pricing', label: 'Pricing' },
          { href: '/contact', label: 'Contact' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="text-sm no-underline transition-colors"
            style={{ color: path === href ? 'var(--text)' : 'var(--text-2)' }}>
            {label}
          </Link>
        ))}
      </div>
      <Link href="/contact"
        className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold no-underline transition-opacity hover:opacity-90"
        style={{ background: 'var(--aqua)', color: 'var(--slate-dark)' }}>
        Book a demo
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </Link>
    </nav>
  )
}
