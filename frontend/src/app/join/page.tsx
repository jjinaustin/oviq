'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = 'loading' | 'waiting' | 'live' | 'error'

type DemoStage =
  | 'discovery'
  | 'context'
  | 'dashboard'
  | 'cases'
  | 'shipments'
  | 'case_detail'
  | 'communications'
  | 'escalation'
  | 'ingest'
  | 'math'
  | 'close'

interface SessionData {
  prospect_name:    string
  brokerage_name:   string | null
  scheduled_at:     string
  conversation_url: string
  status:           string
}

interface Stage {
  key:         DemoStage
  label:       string
  url:         string | null
  repCue:      string   // what the rep says to cue the next button
}

// ─── Stage Config ─────────────────────────────────────────────────────────────

const STAGES: Stage[] = [
  {
    key:    'discovery',
    label:  'Discovery',
    url:    null,
    repCue: 'Got it — let me show you exactly what changes.',
  },
  {
    key:    'context',
    label:  'Overview',
    url:    null,
    repCue: 'Let me pull up the app.',
  },
  {
    key:    'dashboard',
    label:  'Dashboard',
    url:    '/dashboard',
    repCue: 'Take a look at the screen on your right — when you\'re ready, click next.',
  },
  {
    key:    'cases',
    label:  'Cases',
    url:    '/cases',
    repCue: 'Let me show you what\'s happening under the hood on one of these.',
  },
  {
    key:    'shipments',
    label:  'Shipments',
    url:    '/shipments',
    repCue: 'Here\'s the one I want to show you.',
  },
  {
    key:    'case_detail',
    label:  'Case Detail',
    url:    '/cases',
    repCue: 'Scroll down to the timeline — take a moment to read it.',
  },
  {
    key:    'communications',
    label:  'Communications',
    url:    '/cases',
    repCue: 'Let me show you what happens when the carrier doesn\'t respond.',
  },
  {
    key:    'escalation',
    label:  'Escalation',
    url:    '/cases',
    repCue: 'Want to see this on your actual shipments?',
  },
  {
    key:    'ingest',
    label:  'Your Data',
    url:    '/ingest',
    repCue: 'Let me show you what this means for your operation specifically.',
  },
  {
    key:    'math',
    label:  'The Math',
    url:    null,
    repCue: 'Does that math feel roughly right for your operation?',
  },
  {
    key:    'close',
    label:  'Next Steps',
    url:    null,
    repCue: '',
  },
]

// ─── Oviq Glyph ───────────────────────────────────────────────────────────────

function OviqGlyph({ size = 20, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" style={{ width: size, height: size, flexShrink: 0 }}>
      <path
        d="M87.6 36.3 A40 40 0 1 1 66.9 13.7"
        strokeWidth="9"
        strokeLinecap="round"
        stroke={dark ? 'rgba(247,245,239,0.7)' : 'var(--ink)'}
      />
      <circle cx="88.6" cy="15.2" r="8.5" fill="var(--teal)" />
    </svg>
  )
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(targetDate: string | null) {
  const [diff, setDiff] = useState<number | null>(null)
  useEffect(() => {
    if (!targetDate) return
    const target = new Date(targetDate).getTime()
    function tick() { setDiff(target - Date.now()) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  if (diff === null) return null
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, past: true }
  const totalSecs = Math.floor(diff / 1000)
  return {
    hours:   Math.floor(totalSecs / 3600),
    minutes: Math.floor((totalSecs % 3600) / 60),
    seconds: totalSecs % 60,
    past:    false,
  }
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bone)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontSize: 14, color: 'var(--body)', fontFamily: 'var(--sans)' }}>Getting your demo ready…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bone)', fontFamily: 'var(--sans)' }}>
      <header style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OviqGlyph size={22} />
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.04em' }}>oviq</span>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(207,82,71,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" style={{ width: 22, height: 22, stroke: 'var(--red)' }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Something went wrong</h2>
          <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.65, marginBottom: 24 }}>{message}</p>
          <p style={{ fontSize: 13, color: 'var(--faint)' }}>Need help? Email <a href="mailto:johnston@oviq.io" style={{ color: 'var(--teal)', fontWeight: 600 }}>johnston@oviq.io</a></p>
        </div>
      </main>
    </div>
  )
}

// ─── Waiting screen ───────────────────────────────────────────────────────────

function WaitingScreen({ session, onJoin, sessionToken }: { session: SessionData; onJoin: () => void; sessionToken: string }) {
  const countdown = useCountdown(session.scheduled_at)
  const firstName = session.prospect_name.split(' ')[0]
  const pad = (n: number) => String(n).padStart(2, '0')

  useEffect(() => { if (countdown?.past) onJoin() }, [countdown?.past])

  // Poll every 30 seconds — when server creates the Tavus room
  // (within 5 min of scheduled time) this will pick it up automatically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/demo/sessions/${sessionToken}`)
        if (res.ok) {
          const data = await res.json()
          if (data.conversation_url) {
            onJoin()
          }
        }
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [sessionToken])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bone)', fontFamily: 'var(--sans)' }}>
      <header style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OviqGlyph size={22} />
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.04em' }}>oviq</span>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--mist)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <OviqGlyph size={26} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.2 }}>
            Hi {firstName}, your demo<br />starts soon.
          </h1>
          <p style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.65, marginBottom: 32 }}>
            You're booked for a 15-minute Oviq demo{session.brokerage_name ? ` for ${session.brokerage_name}` : ''}.
          </p>
          {countdown && !countdown.past && (
            <div style={{ display: 'inline-flex', gap: 8, background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '20px 32px', marginBottom: 32 }}>
              {countdown.hours > 0 && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>{pad(countdown.hours)}</div>
                    <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>hrs</div>
                  </div>
                  <div style={{ fontSize: 28, color: 'var(--line)', fontWeight: 300, lineHeight: 1.1 }}>:</div>
                </>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>{pad(countdown.minutes)}</div>
                <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>min</div>
              </div>
              <div style={{ fontSize: 28, color: 'var(--line)', fontWeight: 300, lineHeight: 1.1 }}>:</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>{pad(countdown.seconds)}</div>
                <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>sec</div>
              </div>
            </div>
          )}
          {countdown && !countdown.past && countdown.hours === 0 && countdown.minutes <= 10 && (
            <div style={{ marginBottom: 24 }}>
              <button onClick={onJoin} style={{ padding: '13px 28px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Join early
              </button>
              <p style={{ fontSize: 12, color: 'var(--faint)', marginTop: 10 }}>Your demo rep is ready when you are.</p>
            </div>
          )}
          <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px', textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>What to expect</div>
            {[
              { icon: '🎥', text: 'A 15-minute video demo — no slides, just the live product.' },
              { icon: '🎙️', text: 'Make sure your microphone is enabled when you join.' },
              { icon: '👆', text: 'You\'ll advance through the demo at your own pace using a Next button.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13.5, color: 'var(--body)', lineHeight: 1.55 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Close Panel ──────────────────────────────────────────────────────────────

function ClosePanel({ prospectName }: { prospectName: string }) {
  const firstName = prospectName.split(' ')[0]
  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL || 'https://oviq.io/pricing'
  const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_CALENDLY || 'https://calendly.com/johnston-oviq/onboarding'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: 'var(--paper)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <OviqGlyph size={32} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.03em', marginTop: 20, marginBottom: 10, lineHeight: 1.2 }}>
          Ready to get started, {firstName}?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.65, marginBottom: 32 }}>
          14-day money-back guarantee. Johnston personally onboards every new customer — usually under an hour.
        </p>

        {/* Primary CTA */}
        <a
          href={checkoutUrl}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '16px 24px',
            background: 'var(--teal)', color: '#fff',
            borderRadius: 12, fontSize: 16, fontWeight: 700,
            textDecoration: 'none', marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          Start free trial — from $299/month
        </a>

        {/* Secondary CTA */}
        <a
          href={onboardingUrl}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100%', padding: '14px 24px',
            background: 'var(--paper)', color: 'var(--ink)',
            border: '1.5px solid var(--line)',
            borderRadius: 12, fontSize: 15, fontWeight: 600,
            textDecoration: 'none', marginBottom: 28,
            letterSpacing: '-0.01em',
          }}
        >
          Talk to Johnston first — book 30 minutes
        </a>

        {/* Pricing summary */}
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { plan: 'Starter', loads: 'Up to 500 loads/mo', price: '$299' },
            { plan: 'Growth',  loads: 'Up to 2,000 loads/mo', price: '$799' },
            { plan: 'Pro',     loads: 'Up to 5,000 loads/mo', price: '$1,499' },
          ].map((tier, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none', background: i === 1 ? 'var(--mist)' : 'transparent' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{tier.plan}</div>
                <div style={{ fontSize: 12, color: 'var(--faint)' }}>{tier.loads}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: i === 1 ? 'var(--teal)' : 'var(--ink)', fontFamily: 'var(--mono)' }}>{tier.price}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span></div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', marginTop: 16 }}>
          All plans include 14-day money-back guarantee · No long-term contracts
        </p>
      </div>
    </div>
  )
}

// ─── Product Panel ────────────────────────────────────────────────────────────

function ProductPanel({ stage, prospectName }: { stage: Stage; prospectName: string }) {
  const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.oviq.io'

  if (stage.key === 'close') return <ClosePanel prospectName={prospectName} />

  if (stage.key === 'math') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <OviqGlyph size={40} />
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 20, marginBottom: 12, letterSpacing: '-0.02em' }}>The math on your operation</h3>
          <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.65 }}>Your demo rep is walking through the ROI calculation now. Listen for your load volume numbers.</p>
        </div>
      </div>
    )
  }

  if (!stage.url || stage.key === 'discovery' || stage.key === 'context') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <OviqGlyph size={40} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginTop: 20, marginBottom: 12, letterSpacing: '-0.02em' }}>
            {stage.key === 'discovery' ? 'Tell us about your operation' : 'Setting up your demo'}
          </h3>
          <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.65 }}>
            {stage.key === 'discovery'
              ? 'Your demo rep will ask a few questions to personalize what you see next.'
              : 'The product is about to open. Get ready to see Oviq in action.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <iframe
      key={stage.key}
      src={`${appBase}${stage.url}`}
      style={{ width: '100%', height: '100%', border: 'none' }}
      title={`Oviq — ${stage.label}`}
    />
  )
}

// ─── Live screen ──────────────────────────────────────────────────────────────

function LiveScreen({ session }: { session: SessionData }) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [stageIndex, setStageIndex]     = useState(0)
  const currentStage = STAGES[stageIndex]
  const isLast = stageIndex === STAGES.length - 1
  const firstName = session.prospect_name.split(' ')[0]
  const callRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load Daily call client so we can send live events to the rep
  useEffect(() => {
    let mounted = true

    async function loadDaily() {
      const DailyIframe = (await import('@daily-co/daily-js')).default

      const frame = DailyIframe.createFrame(containerRef.current!, {
        iframeStyle: { width: '100%', height: '100%', border: '0' },
        showLeaveButton: false,
        showFullscreenButton: false,
      })

      callRef.current = frame

      frame.on('loaded', () => { if (mounted) setIframeLoaded(true) })
      frame.on('joined-meeting', () => { if (mounted) setIframeLoaded(true) })

      // Run a quick network check (max 10s) before joining
      try {
        const testObj = DailyIframe.createCallObject()
        const qualityPromise = testObj.testCallQuality()
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ result: 'timeout' }), 10000))
        const quality = await Promise.race([qualityPromise, timeoutPromise]) as any
        testObj.destroy()
        if (quality.result === 'bad') {
          console.warn('Poor network detected — joining anyway')
        }
      } catch (e) {
        console.warn('Network check error, proceeding:', e)
      }

      await frame.join({ url: session.conversation_url })
    }

    loadDaily()

    return () => {
      mounted = false
      if (callRef.current) {
        callRef.current.leave()
        callRef.current.destroy()
      }
    }
  }, [session.conversation_url])

  function sendStageUpdate(stage: Stage) {
    if (!callRef.current || !stage.repCue) return
    try {
      // Interrupt the rep first, then echo the next line
      callRef.current.sendAppMessage({
        message_type: 'conversation',
        event_type: 'conversation.interrupt',
      }, '*')

      setTimeout(() => {
        callRef.current?.sendAppMessage({
          message_type: 'conversation',
          event_type: 'conversation.echo',
          properties: {
            modality: 'text',
            text: stage.repCue,
            done: true,
          },
        }, '*')
      }, 400)
    } catch (err) {
      console.error('Failed to send stage update to rep:', err)
    }
  }

  const advancingRef = useRef(false)

  function advance() {
    if (isLast) return
    if (advancingRef.current) return
    advancingRef.current = true
    setTimeout(() => { advancingRef.current = false }, 3000)
    setStageIndex(i => i + 1)
  }

  // When stage changes, send the current stage repCue to the rep
  // This ensures the rep always talks about what is currently on screen
  useEffect(() => {
    if (currentStage.repCue) {
      const timer = setTimeout(() => {
        sendStageUpdate(currentStage)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [currentStage.key])

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)', fontFamily: 'var(--sans)' }}>

      {/* Top bar */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, borderBottom: '1px solid rgba(247,245,239,0.08)', flexShrink: 0, background: 'var(--ink)' }}>
        <OviqGlyph size={16} dark />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(247,245,239,0.6)', letterSpacing: '-0.02em' }}>Oviq Demo</span>
        <span style={{ fontSize: 13, color: 'rgba(247,245,239,0.2)' }}>·</span>
        <span style={{ fontSize: 13, color: 'rgba(247,245,239,0.4)' }}>{firstName}</span>

        {/* Stage pills */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', marginLeft: 8 }}>
          {STAGES.map((s, i) => (
            <div key={s.key} style={{
              width: i === stageIndex ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i < stageIndex ? 'var(--teal)' : i === stageIndex ? 'var(--teal)' : 'rgba(247,245,239,0.15)',
              transition: 'all .3s ease',
              flexShrink: 0,
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', boxShadow: '0 0 0 3px rgba(14,142,124,0.25)' }} />
          <span style={{ fontSize: 12, color: 'rgba(247,245,239,0.4)', fontFamily: 'var(--mono)' }}>Live</span>
        </div>
      </div>

      {/* Main split panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left — Tavus video rep */}
        <div style={{ width: '38%', flexShrink: 0, position: 'relative', borderRight: '1px solid rgba(247,245,239,0.08)' }}>
          {!iframeLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(247,245,239,0.1)', borderTopColor: 'var(--teal)', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'rgba(247,245,239,0.4)' }}>Connecting to your demo rep…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', opacity: iframeLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
          />
        </div>

        {/* Right — Product panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Stage label bar */}
          <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: 'var(--paper)', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', background: 'var(--mist)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                {currentStage.label}
              </span>
              {currentStage.key !== 'close' && (
                <span style={{ fontSize: 12, color: 'var(--faint)' }}>
                  {stageIndex + 1} of {STAGES.length}
                </span>
              )}
            </div>

            {/* Next button */}
            {!isLast && (
              <button
                onClick={advance}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px',
                  background: 'var(--teal)', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--sans)',
                  letterSpacing: '-0.01em',
                }}
              >
                Next
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, stroke: 'currentColor' }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          {/* Product content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ProductPanel stage={currentStage} prospectName={session.prospect_name} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function JoinPageInner() {
  const searchParams = useSearchParams()
  const sessionToken = searchParams.get('session')

  const [pageState, setPageState] = useState<PageState>('loading')
  const [session,   setSession]   = useState<SessionData | null>(null)
  const [errorMsg,  setErrorMsg]  = useState('')

  useEffect(() => {
    if (!sessionToken) {
      setErrorMsg('No session found. Check your calendar invite for the correct link.')
      setPageState('error')
      return
    }

    async function fetchSession() {
      try {
        const res = await fetch(`/api/demo/sessions/${sessionToken}`)
        if (res.status === 404) {
          setErrorMsg("This demo link isn't valid. Check your calendar invite or email johnston@oviq.io.")
          setPageState('error')
          return
        }
        if (!res.ok) {
          setErrorMsg('Something went wrong starting your demo. Please refresh the page.')
          setPageState('error')
          return
        }
        const data: SessionData = await res.json()
        setSession(data)
        const diffMins = (new Date(data.scheduled_at).getTime() - Date.now()) / 60000
        setPageState(diffMins > 10 ? 'waiting' : 'live')
      } catch {
        setErrorMsg('Could not connect. Please check your internet and refresh.')
        setPageState('error')
      }
    }

    fetchSession()
  }, [sessionToken])

  if (pageState === 'loading') return <LoadingScreen />
  if (pageState === 'error')   return <ErrorScreen message={errorMsg} />
  if (pageState === 'waiting' && session) return <WaitingScreen session={session} onJoin={() => setPageState('live')} />
  if (pageState === 'live' && session)    return <LiveScreen session={session} />
  return <LoadingScreen />
}

export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <JoinPageInner />
    </Suspense>
  )
}