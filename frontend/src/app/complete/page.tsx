'use client'
export const dynamic = 'force-dynamic'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function OviqMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg viewBox="0 0 100 100" fill="none" style={{ width: 28, height: 28 }}>
        <path
          d="M87.6 36.3 A40 40 0 1 1 66.9 13.7"
          strokeWidth="9"
          strokeLinecap="round"
          stroke="var(--ink)"
        />
        <circle cx="88.6" cy="15.2" r="8.5" fill="var(--teal)" />
      </svg>
      <span style={{
        fontFamily: 'var(--sans)',
        fontWeight: 800,
        fontSize: 20,
        color: 'var(--ink)',
        letterSpacing: '-0.04em',
      }}>
        oviq
      </span>
    </div>
  )
}

function CompletePageInner() {
  const searchParams  = useSearchParams()
  const name          = searchParams.get('name') || 'there'
  const firstName     = name.split(' ')[0]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bone)',
      fontFamily: 'var(--sans)',
    }}>
      {/* Header */}
      <header style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--paper)',
      }}>
        <OviqMark />
      </header>

      {/* Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>

          {/* Check mark */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--mist)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
          }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28, stroke: 'var(--teal-deep)' }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 800, color: 'var(--ink)',
            letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.2,
          }}>
            Thanks, {firstName}.
          </h1>

          <p style={{
            fontSize: 15, color: 'var(--body)', lineHeight: 1.7, marginBottom: 40,
          }}>
            Your demo is complete. Someone from the Oviq team will follow up with you shortly — usually within a few hours.
          </p>

          {/* Next steps */}
          <div style={{
            background: 'var(--paper)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: 32,
            textAlign: 'left',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--line)',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--faint)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              What happens next
            </div>

            {[
              {
                step: '01',
                title: 'You\'ll receive a follow-up email',
                body:  'We\'ll send you the Oviq one-pager and a link to book your onboarding call.',
              },
              {
                step: '02',
                title: 'Onboarding takes less than an hour',
                body:  'We connect your TMS report and ops inbox together on a screen share. Most customers are live same day.',
              },
              {
                step: '03',
                title: '14-day money-back guarantee',
                body:  'Get started with zero risk. If Oviq isn\'t saving your team time in two weeks, you pay nothing.',
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 16,
                padding: '18px 20px',
                borderBottom: i < 2 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--teal-deep)',
                  background: 'var(--mist)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  flexShrink: 0,
                  height: 'fit-content',
                  marginTop: 2,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.55 }}>
                    {item.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a
            href="https://oviq.io"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--teal-deep)',
              textDecoration: 'none',
            }}
          >
            Learn more at oviq.io
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, stroke: 'currentColor' }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px 32px',
        borderTop: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, color: 'var(--faint)' }}>
          oviq.io · Exception operations for freight brokerages
        </span>
      </footer>
    </div>
  )
}
export default function CompletePage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bone)'}}>Loading...</div>}>
      <CompletePageInner />
    </Suspense>
  )
}
