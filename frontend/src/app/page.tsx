import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-screen px-12 pt-16 pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(39,201,182,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(39,201,182,0.035) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at center, black 20%, transparent 75%)',
        }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 pointer-events-none" style={{
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(39,201,182,0.06) 0%, transparent 65%)',
        }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-8"
            style={{ background: 'var(--aqua-dim)', border: '1px solid rgba(39,201,182,0.2)', color: 'var(--aqua)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--aqua)' }} />
            Exception operations, on autopilot
          </div>
          <h1 className="font-extrabold mb-6" style={{ fontSize: 'clamp(38px, 6vw, 68px)', letterSpacing: '-0.035em', lineHeight: 1.08, color: 'var(--text)' }}>
            We handle the first{' '}
            <span style={{ color: 'var(--aqua)' }}>80% of every</span>{' '}
            shipment problem.
          </h1>
          <p className="mb-10 mx-auto" style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '520px' }}>
            Oviq detects, resolves, and communicates exceptions automatically —
            escalating only what needs your judgment.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-16">
            <Link href="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold no-underline transition-opacity hover:opacity-90"
              style={{ background: 'var(--aqua)', color: 'var(--slate-dark)', fontSize: '15px' }}>
              Book a demo
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/product"
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-medium no-underline"
              style={{ border: '1px solid var(--border-2)', color: 'var(--text)', fontSize: '15px' }}>
              See how it works
            </Link>
          </div>
          <div className="grid grid-cols-3 rounded-xl overflow-hidden border mx-auto max-w-lg"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {[
              { num: '80%', label: 'exceptions resolved automatically' },
              { num: '3×', label: 'freight per coordinator' },
              { num: '<2 min', label: 'average response time' },
            ].map(({ num, label }, i) => (
              <div key={num} className="py-5 px-4 text-center"
                style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
                <p className="font-extrabold mb-1" style={{ fontSize: '26px', letterSpacing: '-0.03em', color: 'var(--aqua)' }}>{num}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)', lineHeight: 1.4 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-12 py-24 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>The problem</p>
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Most logistics software records.<br />It doesn't resolve.
          </h2>
          <p className="text-lg mb-12" style={{ color: 'var(--text-2)' }}>Every exception triggers the same manual loop — over and over, at scale.</p>
          <div className="grid grid-cols-2 gap-12 items-start">
            <div className="space-y-3">
              {[
                ['01', 'Identify the issue', 'buried in a TMS dashboard no one checks in real time.'],
                ['02', 'Contact the carrier', 'phone, email, repeat. No response for hours.'],
                ['03', 'Notify the customer', "manually, after you've already lost trust."],
                ['04', 'Update the TMS', "because systems don't talk to each other."],
                ['05', 'Schedule follow-ups', 'then do it all again tomorrow.'],
              ].map(([num, bold, rest]) => (
                <div key={num} className="flex items-baseline gap-5 p-4 rounded-xl border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold shrink-0 font-mono" style={{ color: 'var(--aqua)' }}>{num}</span>
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                    <strong style={{ color: 'var(--text)' }}>{bold}</strong> — {rest}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[
                ['4–6 hrs', 'Average time an ops coordinator spends on exceptions per day'],
                ['1:300', 'Industry average — one coordinator per 300 monthly loads. Hiring is the only lever.'],
                ['$0', "Value added by manual exception follow-up. It's pure operational cost."],
              ].map(([num, label]) => (
                <div key={num} className="p-6 rounded-xl border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  <p className="font-extrabold mb-2" style={{ fontSize: '38px', letterSpacing: '-0.04em', color: 'var(--aqua)', lineHeight: 1 }}>{num}</p>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>How it works</p>
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>
            From exception to resolved.<br />Without touching it.
          </h2>
          <p className="text-lg mb-12" style={{ color: 'var(--text-2)' }}>Upload a CSV or connect your TMS. Oviq runs continuously from there.</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { num: '01', title: 'Detect', desc: 'Oviq evaluates every shipment continuously for missed pickups, delays, missing PODs, and more.' },
              { num: '02', title: 'Case opened', desc: 'Every exception becomes a managed Case with priority, timeline, and a playbook assigned automatically.' },
              { num: '03', title: 'AI resolves', desc: 'Oviq contacts the carrier, notifies the customer, requests ETAs, and logs every action.' },
              { num: '04', title: 'Escalate only when needed', desc: 'Unresponsive carriers, SLA breaches — Oviq escalates with full context pre-loaded.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-xs font-bold font-mono mb-4" style={{ color: 'var(--aqua)' }}>{num}</p>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="px-12 py-24 border-t border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Early access</p>
          <h2 className="font-extrabold mb-12" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Built with ops teams,<br />not around them.
          </h2>
          <div className="p-8 rounded-2xl border text-left mb-10" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-2)' }}>
            <p className="text-4xl mb-4 leading-none" style={{ color: 'var(--aqua)', opacity: 0.3, fontFamily: 'Georgia, serif' }}>"</p>
            <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.6 }}>
              We were hiring a new coordinator every time volume grew. Oviq changed that math completely — same team, handling three times the freight.
            </p>
            <div className="flex items-center gap-3 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--aqua-dim)', border: '1px solid rgba(39,201,182,0.25)', color: 'var(--aqua)' }}>JR</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>J. Reynolds</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>VP Operations, mid-sized freight brokerage</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 rounded-xl overflow-hidden border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            {[['80%','exceptions auto-resolved'],['3×','loads per coordinator'],['<2 min','first response time'],['$0','additional headcount']].map(([num,label],i) => (
              <div key={num} className="py-5 px-3 text-center" style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <p className="font-extrabold mb-1" style={{ fontSize: '28px', letterSpacing: '-0.04em', color: 'var(--aqua)' }}>{num}</p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Pricing</p>
          <h2 className="font-extrabold mb-2" style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Simple, volume-based pricing.</h2>
          <p className="text-lg mb-10" style={{ color: 'var(--text-2)' }}>14-day free trial on all plans. No setup fees. Cancel any time.</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { tier: 'Starter', price: '$299', volume: 'Up to 500 loads / month', featured: false },
              { tier: 'Growth', price: '$799', volume: 'Up to 5,000 loads / month', featured: true },
              { tier: 'Professional', price: '$1,999', volume: 'Up to 20,000 loads / month', featured: false },
            ].map(({ tier, price, volume, featured }) => (
              <div key={tier} className="p-6 rounded-2xl border relative"
                style={{ background: featured ? 'var(--surface-2)' : 'var(--surface)', borderColor: featured ? 'rgba(39,201,182,0.5)' : 'var(--border)' }}>
                {featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'var(--aqua)', color: 'var(--slate-dark)' }}>MOST POPULAR</div>
                )}
                <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--aqua)' }}>{tier}</p>
                <p className="font-extrabold mb-1" style={{ fontSize: '40px', letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>{price}</p>
                <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>per month after trial</p>
                <p className="text-xs font-semibold mb-4" style={{ color: 'var(--aqua)' }}>✦ 14 days free</p>
                <p className="text-xs mb-6" style={{ color: 'var(--text-2)' }}>{volume}</p>
                <Link href="/contact"
                  className="block text-center py-3 rounded-lg text-sm font-bold no-underline"
                  style={{ background: featured ? 'var(--aqua)' : 'transparent', color: featured ? 'var(--slate-dark)' : 'var(--text)', border: featured ? 'none' : '1px solid var(--border-2)' }}>
                  Start free trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-12 py-24 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(30px, 4vw, 50px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>
            Resolve before it <span style={{ color: 'var(--aqua)' }}>reaches you.</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: 'var(--text-2)' }}>Join freight brokerages already handling more freight with the same team.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold no-underline transition-opacity hover:opacity-90"
              style={{ background: 'var(--aqua)', color: 'var(--slate-dark)', fontSize: '15px' }}>
              Book a demo
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/product"
              className="flex items-center gap-2 px-7 py-3.5 rounded-lg font-medium no-underline"
              style={{ border: '1px solid var(--border-2)', color: 'var(--text)', fontSize: '15px' }}>
              See how it works
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
