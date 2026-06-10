import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'
import Link from 'next/link'

export default function ProductPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <MarketingNav />
      <div className="pt-16">
        <div className="px-12 py-20 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Product</p>
            <h1 className="font-extrabold mb-4" style={{ fontSize: 'clamp(34px,4vw,52px)', letterSpacing: '-0.035em', color: 'var(--text)', lineHeight: 1.1 }}>
              Exception operations,<br /><span style={{ color: 'var(--aqua)' }}>fully automated.</span>
            </h1>
            <p className="text-lg" style={{ color: 'var(--text-2)', maxWidth: '560px', lineHeight: 1.7 }}>
              Oviq is an AI-native operations layer that sits above your TMS — detecting every shipment exception, running resolution playbooks, and escalating only when human judgment is genuinely required.
            </p>
          </div>
        </div>

        <div className="px-12 py-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Workflow</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(28px,3.5vw,42px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>
              From detection to resolution<br />in minutes, not hours.
            </h2>
            <p className="text-lg mb-10" style={{ color: 'var(--text-2)' }}>Four steps. Most handled automatically.</p>
            <div className="grid grid-cols-4 gap-4 mb-16">
              {[
                { num: '01', title: 'Detect', desc: 'Oviq continuously evaluates every shipment against expected pickup, delivery, and status milestones.' },
                { num: '02', title: 'Case opened', desc: 'Every exception becomes a structured Case with priority, timeline, assigned playbook, and full audit trail.' },
                { num: '03', title: 'AI resolves', desc: 'Oviq drafts and sends carrier and customer communications, requests ETAs, and logs every action with a confidence score.' },
                { num: '04', title: 'Escalate only when needed', desc: 'When AI confidence falls below threshold, carriers go dark, or financial exposure crosses a limit — Oviq escalates with full context.' },
              ].map(({ num, title, desc }) => (
                <div key={num} className="p-6 rounded-xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="text-xs font-bold font-mono mb-4" style={{ color: 'var(--aqua)' }}>{num}</p>
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Exception types</p>
            <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Six types. All handled automatically.</h2>
            <p className="text-base mb-8" style={{ color: 'var(--text-2)' }}>V1 covers the exceptions that generate 90% of manual ops work.</p>
            <div className="grid grid-cols-3 gap-3 mb-16">
              {['Missed Pickup','Delayed Transit','Late Delivery','Missing POD','Carrier Unresponsive','Customer Complaint'].map(name => (
                <div key={name} className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--aqua)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{name}</span>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Resolution playbooks</p>
            <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Define once. Runs every time.</h2>
            <p className="text-base mb-8" style={{ color: 'var(--text-2)' }}>Each exception type has a configurable step-by-step playbook.</p>
            <div className="space-y-3 mb-16">
              {[
                { label: 'Missed Pickup', steps: [['ai','Contact carrier'],['ai','Notify customer'],['ai','Follow up in 60 min'],['human','Escalate if no response']] },
                { label: 'Late Delivery', steps: [['ai','Request ETA'],['ai','Notify customer'],['human','Escalate if SLA missed']] },
                { label: 'Missing POD', steps: [['ai','Request POD'],['ai','Follow up at 24 hrs'],['human','Escalate at 48 hrs']] },
              ].map(({ label, steps }) => (
                <div key={label} className="grid rounded-xl border overflow-hidden"
                  style={{ gridTemplateColumns: '180px 1fr', background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="px-5 py-4 border-r flex items-center" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
                  </div>
                  <div className="px-5 py-4 flex items-center gap-2 flex-wrap">
                    {steps.map(([type, text], i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-md border" style={{
                          color: type === 'ai' ? 'var(--aqua)' : '#f0a030',
                          background: type === 'ai' ? 'var(--aqua-dim)' : 'rgba(240,160,48,0.08)',
                          borderColor: type === 'ai' ? 'rgba(39,201,182,0.25)' : 'rgba(240,160,48,0.25)',
                        }}>{text}</span>
                        {i < steps.length - 1 && <span className="text-xs" style={{ color: 'var(--text-3)' }}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Integrations</p>
            <h2 className="font-extrabold mb-3" style={{ fontSize: 'clamp(24px,3vw,36px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Keep your TMS. Add Oviq on top.</h2>
            <p className="text-base mb-6" style={{ color: 'var(--text-2)', maxWidth: '500px' }}>Start with CSV import today, direct integration in V2.</p>
            <div className="flex gap-3 flex-wrap">
              {['McLeod','Aljex','Ascend','CSV / any TMS'].map(tms => (
                <span key={tms} className="px-4 py-2 rounded-lg text-sm font-semibold border font-mono"
                  style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>{tms}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-12 py-16 text-center border-t" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(28px,3.5vw,44px)', letterSpacing: '-0.03em', color: 'var(--text)' }}>Ready to see it in action?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-2)' }}>30 minutes. Your data. Real exceptions.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-bold no-underline transition-opacity hover:opacity-90"
            style={{ background: 'var(--aqua)', color: 'var(--slate-dark)', fontSize: '15px' }}>Book a demo →</Link>
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
