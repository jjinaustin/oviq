'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState =
  | 'loading'       // fetching session
  | 'waiting'       // session found, too early to join
  | 'ready'         // within join window, Tavus room loading
  | 'live'          // Tavus iframe visible and running
  | 'error'         // session not found or Tavus failed
  | 'expired'       // session too old

interface SessionData {
  prospect_name:    string
  brokerage_name:   string | null
  scheduled_at:     string
  conversation_url: string
  status:           string
}

// ─── Oviq Mark ────────────────────────────────────────────────────────────────

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

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(targetDate: string | null) {
  const [diff, setDiff] = useState<number | null>(null)

  useEffect(() => {
    if (!targetDate) return
    const target = new Date(targetDate).getTime()

    function tick() {
      setDiff(target - Date.now())
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (diff === null) return null
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, past: true }

  const totalSecs = Math.floor(diff / 1000)
  const hours     = Math.floor(totalSecs / 3600)
  const minutes   = Math.floor((totalSecs % 3600) / 60)
  const seconds   = totalSecs % 60
  return { hours, minutes, seconds, past: false }
}

// ─── Format scheduled time ────────────────────────────────────────────────────

function formatScheduled(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString([], {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
  })
}

// ─── Loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <PageShell>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid var(--line)',
          borderTopColor: 'var(--teal)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: 14, color: 'var(--body)' }}>Getting your demo ready…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  )
}

// ─── Error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ message }: { message: string }) {
  return (
    <PageShell>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(207,82,71,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" style={{ width: 22, height: 22, stroke: 'var(--red)' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.65, marginBottom: 24 }}>
          {message}
        </p>
        <p style={{ fontSize: 13, color: 'var(--faint)' }}>
          Need help? Email <a href="mailto:johnston@oviq.io" style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>johnston@oviq.io</a>
        </p>
      </div>
    </PageShell>
  )
}

// ─── Waiting screen ───────────────────────────────────────────────────────────

function WaitingScreen({ session, onJoin }: {
  session:  SessionData
  onJoin:   () => void
}) {
  const countdown = useCountdown(session.scheduled_at)
  const firstName = session.prospect_name.split(' ')[0]

  // Auto-advance when countdown hits zero
  useEffect(() => {
    if (countdown?.past) onJoin()
  }, [countdown?.past])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <PageShell>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Greeting */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--mist)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <svg viewBox="0 0 100 100" fill="none" style={{ width: 28, height: 28 }}>
            <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="9" strokeLinecap="round" stroke="var(--teal-deep)" />
            <circle cx="88.6" cy="15.2" r="8.5" fill="var(--teal)" />
          </svg>
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800, color: 'var(--ink)',
          letterSpacing: '-0.03em', marginBottom: 10, lineHeight: 1.2,
        }}>
          Hi {firstName}, your demo<br />starts soon.
        </h1>

        <p style={{ fontSize: 15, color: 'var(--body)', lineHeight: 1.65, marginBottom: 36 }}>
          You're booked for a 30-minute Oviq demo
          {session.brokerage_name ? ` for ${session.brokerage_name}` : ''}.
          <br />
          <span style={{ color: 'var(--faint)', fontSize: 13 }}>
            {formatScheduled(session.scheduled_at)}
          </span>
        </p>

        {/* Countdown */}
        {countdown && !countdown.past && (
          <div style={{
            display: 'inline-flex',
            gap: 8,
            background: 'var(--bone)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: '20px 32px',
            marginBottom: 32,
          }}>
            {countdown.hours > 0 && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {pad(countdown.hours)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>hrs</div>
                </div>
                <div style={{ fontSize: 28, color: 'var(--line)', fontWeight: 300, lineHeight: 1.1 }}>:</div>
              </>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {pad(countdown.minutes)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>min</div>
            </div>
            <div style={{ fontSize: 28, color: 'var(--line)', fontWeight: 300, lineHeight: 1.1 }}>:</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {pad(countdown.seconds)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>sec</div>
            </div>
          </div>
        )}

        {/* Early join option — show 10 min before */}
        {countdown && !countdown.past && countdown.hours === 0 && countdown.minutes <= 10 && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={onJoin}
              className="btn btn-primary"
              style={{ fontSize: 15, padding: '13px 28px' }}
            >
              Join early
            </button>
            <p style={{ fontSize: 12, color: 'var(--faint)', marginTop: 10 }}>
              Your demo rep is ready when you are.
            </p>
          </div>
        )}

        {/* What to expect */}
        <div style={{
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '20px 24px',
          textAlign: 'left',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
            What to expect
          </div>
          {[
            { icon: '🎥', text: 'A 30-minute video demo — no slides, just the live product.' },
            { icon: '🎙️', text: 'Make sure your microphone is enabled when you join.' },
            { icon: '⚡', text: 'The demo runs automatically — no waiting for anyone to join.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13.5, color: 'var(--body)', lineHeight: 1.55 }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}

// ─── Live screen ──────────────────────────────────────────────────────────────

function LiveScreen({ session }: { session: SessionData }) {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const firstName = session.prospect_name.split(' ')[0]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Minimal header */}
      <div style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        borderBottom: '1px solid rgba(247,245,239,0.08)',
        flexShrink: 0,
      }}>
        <svg viewBox="0 0 100 100" fill="none" style={{ width: 18, height: 18 }}>
          <path d="M87.6 36.3 A40 40 0 1 1 66.9 13.7" strokeWidth="9" strokeLinecap="round" stroke="rgba(247,245,239,0.6)" />
          <circle cx="88.6" cy="15.2" r="8.5" fill="var(--teal)" />
        </svg>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(247,245,239,0.6)', letterSpacing: '-0.02em' }}>
          Oviq Demo
        </span>
        <span style={{ fontSize: 13, color: 'rgba(247,245,239,0.3)' }}>·</span>
        <span style={{ fontSize: 13, color: 'rgba(247,245,239,0.4)' }}>{firstName}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--teal)',
            display: 'inline-block',
            boxShadow: '0 0 0 3px rgba(14,142,124,0.25)',
          }} />
          <span style={{ fontSize: 12, color: 'rgba(247,245,239,0.4)', fontFamily: 'var(--mono)' }}>Live</span>
        </div>
      </div>

      {/* Tavus iframe */}
      {!iframeLoaded && (
        <div style={{
          position: 'absolute', inset: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(247,245,239,0.1)',
            borderTopColor: 'var(--teal)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: 'rgba(247,245,239,0.4)' }}>Connecting…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <iframe
        src={session.conversation_url}
        allow="camera; microphone; autoplay; display-capture"
        onLoad={() => setIframeLoaded(true)}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          opacity: iframeLoaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        title="Oviq Demo"
      />
    </div>
  )
}

// ─── Page shell (centered layout for non-live states) ─────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
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
        {children}
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

// ─── Main component ───────────────────────────────────────────────────────────

function JoinPageInner() {
  const searchParams  = useSearchParams()
  const sessionToken  = searchParams.get('session')

  const [pageState, setPageState]   = useState<PageState>('loading')
  const [session,   setSession]     = useState<SessionData | null>(null)
  const [errorMsg,  setErrorMsg]    = useState('')

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
          setErrorMsg('This demo link isn\'t valid. Check your calendar invite or email johnston@oviq.io.')
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

        // Determine whether to show waiting screen or go live
        const scheduled  = new Date(data.scheduled_at).getTime()
        const now        = Date.now()
        const diffMins   = (scheduled - now) / 60000

        if (diffMins > 10) {
          // More than 10 min early — show waiting screen
          setPageState('waiting')
        } else {
          // Within 10 min window or past scheduled time — go live
          setPageState('live')
        }
      } catch {
        setErrorMsg('Could not connect. Please check your internet and refresh.')
        setPageState('error')
      }
    }

    fetchSession()
  }, [sessionToken])

  // ── Render ────────────────────────────────────────────────────────────────

  if (pageState === 'loading') return <LoadingScreen />
  if (pageState === 'error')   return <ErrorScreen message={errorMsg} />

  if (pageState === 'waiting' && session) {
    return (
      <WaitingScreen
        session={session}
        onJoin={() => setPageState('live')}
      />
    )
  }

  if ((pageState === 'live' || pageState === 'ready') && session) {
    return <LiveScreen session={session} />
  }

  return <LoadingScreen />
}
export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <JoinPageInner />
    </Suspense>
  )
}
