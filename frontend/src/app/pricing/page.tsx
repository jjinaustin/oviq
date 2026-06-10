import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const PLANS = [
  { tier: 'Starter', price: '$299', volume: 'Up to 500 loads / month', featured: false, features: ['Exception detection (6 types)', 'Automated carrier emails', 'Customer notifications', 'Case management dashboard', 'Full event timeline', 'CSV import', 'Email support'] },
  { tier: 'Growth', price: '$799', volume: 'Up to 5,000 loads / month', featured: true, features: ['Everything in Starter', 'Custom resolution playbooks', 'Escalation rules configuration', 'Multi-user access (up to 10)', 'AI action audit log', 'Priority email + chat support', 'Onboarding call'] },
  { tier: 'Professional', price: '$1,999', volume: 'Up to 20,000 loads / month', featured: false, features: ['Everything in Growth', 'TMS direct integration (V2)', 'Custom exception types', 'Unlimited users', 'Dedicated onboarding', 'SLA reporting + API access'] },
]

const FAQ = [
  { q: 'How does the free trial work?', a: "Every plan includes a 14-day free trial. You'll enter your card details at signup but won't be charged until the trial ends. Cancel any time before then and you won't pay anything." },
  { q: 'Do I need to replace my TMS?', a: 'No. Oviq sits above your existing TMS. Keep using McLeod, Aljex, Ascend, or whatever you have. Start by uploading a CSV export.' },
  { q: 'What counts as a load?', a: "A load is any shipment record imported into Oviq in a given month. Loads that don't generate exceptions still count toward your volume." },
  { q: 'Can I upgrade or downgrade?', a: 'Yes, at any time. Upgrades take effect immediately. Downgrades apply at the start of your next billing period.' },
  { q: 'What happens if I go over my limit?', a: "We'll notify you when you're approaching your limit. You can upgrade before exceeding it, or we'll apply a per-load overage rate." },
  { q: 'How does billing work?', a: 'Monthly, billed on your signup date after the trial ends. Annual billing with a discount is available on Growth and Professional — contact us.' },
]

export default function PricingPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <MarketingNav />
      <div className="pt-16">
        <div className="text-center px-12 py-20 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Pricing</p>
          <h1 className="font-extrabold mb-4" style={{ fontSize: 'clamp(34px,4vw,52px)', letterSpacing: '-0.035em', color: 'var(--text)' }}>
            Simple pricing.<br /><span style={{ color: 'var(--aqua)' }}>No surprises.</span>
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--text-2)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            Volume-based. No setup fees. No long-term contracts. Cancel any time.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'var(--aqua-dim)', border: '1px solid rgba(39,201,182,0.25)', color: 'var(--aqua)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--aqua)' }} />
            14-day free trial on all plans
          </div>
        </div>

        <div className="px-12 py-16">
          <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
            {PLANS.map(({ tier, price, volume, featured, features }) => (
              <div key={tier} className="flex flex-col p-8 rounded-2xl border relative"
                style={{ background: featured ? 'var(--surface-2)' : 'var(--surface)', borderColor: featured ? 'rgba(39,201,182,0.5)' : 'var(--border)' }}>
                {featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--aqua)', color: 'var(--slate-dark)' }}>MOST POPULAR</div>}
                <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>{tier}</p>
                <p className="font-extrabold mb-1" style={{ fontSize: '48px', letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{price}</p>
                <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>per month after trial</p>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--aqua)' }}>✦ 14 days free to start</p>
                <p className="text-sm mb-6 pb-6 border-b" style={{ color: 'var(--text-2)', borderColor: 'var(--border)' }}>{volume}</p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--aqua)', flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="block text-center py-3 rounded-lg text-sm font-bold no-underline"
                  style={{ background: featured ? 'var(--aqua)' : 'transparent', color: featured ? 'var(--slate-dark)' : 'var(--text)', border: featured ? 'none' : '1px solid var(--border-2)' }}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-4" style={{ color: 'var(--text-3)' }}>
            Need 20,000+ loads? <Link href="/contact" style={{ color: 'var(--aqua)' }}>Talk to us →</Link>
          </p>
        </div>

        <div className="px-12 py-16 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>FAQ</p>
            <h2 className="font-extrabold mb-10" style={{ fontSize: 'clamp(28px,3vw,38px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Common questions.</h2>
            <div className="grid grid-cols-2 gap-8">
              {FAQ.map(({ q, a }) => (
                <div key={q}>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{q}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.65 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
