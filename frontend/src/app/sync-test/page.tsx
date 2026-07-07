'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Stage config — must match join/page.tsx exactly ─────────────────────────

const STAGES = [
  {
    key: 'discovery',
    label: 'Discovery',
    url: null,
    repCue: null, // rep greets naturally
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    url: '/dashboard',
    repCue: 'Take a look at the screen on your right. This is what your ops manager sees every morning instead of digging through the TMS. Those three cards — Needs Judgment, Auto-resolving, and Handled Today. Right now 3 exceptions are being handled automatically. Your team has not touched any of them. When you are ready, click Next.',
  },
  {
    key: 'cases',
    label: 'Cases',
    url: '/cases',
    repCue: 'Every exception is a Case. You can see all of them at once — red means it needs your attention, teal means Oviq is actively handling it. Your team never has to dig through the TMS to find problems. Go ahead and click Next and I will show you exactly what is happening inside one of these cases.',
  },
  {
    key: 'case_detail',
    label: 'Case Detail',
    url: '/cases',
    repCue: 'Click on the first case in the list on your screen to open it. Once it opens, scroll down to the timeline and take a moment to read through it.',
  },
  {
    key: 'communications',
    url: '/cases/c45fd008-3921-4d1b-b22c-9e38d61661be',
    url: '/cases',
    repCue: 'This is the actual email Oviq sent — professional, specific, references the load number and route. It comes from your branded address so the carrier thinks they are talking to your team. When the carrier responds it comes straight back here. Click Next to see what happens when the carrier goes dark.',
  },
  {
    key: 'escalation',
    url: '/cases/c45fd008-3921-4d1b-b22c-9e38d61661be',
    url: '/cases',
    repCue: 'This is important. Oviq does not try to handle everything. When the carrier goes dark after two hours it escalates immediately with everything already loaded. Your team only sees what actually needs them. Click Next.',
  },
  {
    key: 'ingest',
    label: 'Your Data',
    url: '/ingest',
    repCue: 'You can see the email address on the screen — copy that and send your TMS export there. Oviq will find your exceptions in under a minute. Click Next and I will show you what this means in real numbers.',
  },
  {
    key: 'math',
    label: 'The Math',
    url: null,
    repCue: 'Let me show you what this means for your operation specifically.',
  },
  {
    key: 'close',
    label: 'Next Steps',
    url: null,
    repCue: null,
  },
]

const APP_BASE = 'https://app.oviq.io'
const CUE_DELAY_MS = 1500 // must match join/page.tsx

export default function SyncTester() {
  const [stageIndex, setStageIndex] = useState(0)
  const [log, setLog] = useState<{ time: string; type: string; text: string }[]>([])
  const [pendingCue, setPendingCue] = useState<string | null>(null)
  const [cueCountdown, setCueCountdown] = useState<number | null>(null)
  const advancingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const currentStage = STAGES[stageIndex]
  const isLast = stageIndex === STAGES.length - 1

  function addLog(type: string, text: string) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLog(prev => [...prev, { time, type, text }])
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function advance() {
    if (isLast || advancingRef.current) return
    advancingRef.current = true
    setTimeout(() => { advancingRef.current = false }, 4000)

    const nextIndex = stageIndex + 1
    const nextStage = STAGES[nextIndex]

    addLog('click', `Next clicked → advancing to "${nextStage.label}"`)
    setStageIndex(nextIndex)
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setStageIndex(0)
    setLog([])
    setPendingCue(null)
    setCueCountdown(null)
    advancingRef.current = false
    addLog('system', 'Reset — starting from Discovery')
  }

  // Simulate repCue firing after delay when stage changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setPendingCue(null)
    setCueCountdown(null)

    if (!currentStage.repCue || currentStage.key === 'discovery') return

    addLog('stage', `Stage changed → "${currentStage.label}" — cue fires in ${CUE_DELAY_MS}ms`)
    setPendingCue(currentStage.repCue)

    // Countdown display
    let remaining = CUE_DELAY_MS
    setCueCountdown(remaining)
    countdownRef.current = setInterval(() => {
      remaining -= 100
      setCueCountdown(remaining)
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current)
        setCueCountdown(null)
      }
    }, 100)

    // Fire cue after delay
    timerRef.current = setTimeout(() => {
      setPendingCue(null)
      addLog('rep', currentStage.repCue!)
    }, CUE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [currentStage.key])

  const logColors: Record<string, string> = {
    click:  '#D4A042',
    stage:  '#6B7280',
    rep:    '#0E8E7C',
    system: '#9C968A',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#F7F5EF' }}>

      {/* Left — Log panel */}
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E7E2D5', background: '#fff' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E7E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1813' }}>Sync Tester</div>
            <div style={{ fontSize: 11, color: '#9C968A', marginTop: 2 }}>No Tavus credits used</div>
          </div>
          <button onClick={reset} style={{ padding: '6px 12px', background: '#F7F5EF', border: '1px solid #E7E2D5', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#615D52' }}>
            Reset
          </button>
        </div>

        {/* Stage pills */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E7E2D5', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {STAGES.map((s, i) => (
            <div key={s.key} style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
              background: i === stageIndex ? '#0E8E7C' : i < stageIndex ? '#EAF3F0' : '#F7F5EF',
              color: i === stageIndex ? '#fff' : i < stageIndex ? '#0E8E7C' : '#9C968A',
            }}>{s.label}</div>
          ))}
        </div>

        {/* Pending cue indicator */}
        {pendingCue && cueCountdown !== null && (
          <div style={{ padding: '10px 20px', background: '#FFF8ED', borderBottom: '1px solid #E7E2D5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A042', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: 12, color: '#D4A042', fontWeight: 600 }}>
              Rep cue fires in {Math.ceil(cueCountdown / 1000)}s…
            </span>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
          </div>
        )}

        {/* Log */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {log.length === 0 && (
            <div style={{ fontSize: 13, color: '#9C968A', textAlign: 'center', marginTop: 40 }}>
              Click Next to start stepping through stages.<br />Watch this log to verify sync timing.
            </div>
          )}
          {log.map((entry, i) => (
            <div key={i} style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 10, color: '#9C968A', flexShrink: 0, marginTop: 2, fontFamily: 'monospace' }}>{entry.time}</span>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, color: logColors[entry.type], textTransform: 'uppercase', marginRight: 4 }}>{entry.type}</span>
                <span style={{ fontSize: 12, color: entry.type === 'rep' ? '#1A1813' : '#615D52', lineHeight: 1.5 }}>{entry.text}</span>
              </div>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Next button */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E7E2D5' }}>
          <button
            onClick={advance}
            disabled={isLast}
            style={{
              width: '100%', padding: '12px', background: isLast ? '#E7E2D5' : '#0E8E7C',
              color: isLast ? '#9C968A' : '#fff', border: 'none', borderRadius: 8,
              fontSize: 14, fontWeight: 700, cursor: isLast ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isLast ? 'Demo complete' : `Next → ${stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1].label : ''}`}
          </button>
          <div style={{ fontSize: 11, color: '#9C968A', textAlign: 'center', marginTop: 8 }}>
            Stage {stageIndex + 1} of {STAGES.length} · 4s debounce between clicks
          </div>
        </div>
      </div>

      {/* Right — Product panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Stage header */}
        <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#fff', borderBottom: '1px solid #E7E2D5', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0E8E7C', background: '#EAF3F0', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {currentStage.label}
            </span>
            <span style={{ fontSize: 12, color: '#9C968A' }}>{stageIndex + 1} of {STAGES.length}</span>
          </div>
          <span style={{ fontSize: 11, color: '#9C968A' }}>
            {currentStage.url ? `app.oviq.io${currentStage.url}` : 'no product screen'}
          </span>
        </div>

        {/* Product or placeholder */}
        {currentStage.key === 'case_detail' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', background: '#0E8E7C', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>👆 Click on the first case in the list to open it, then scroll down to the timeline.</span>
            </div>
            <iframe src={`${APP_BASE}/cases`} style={{ flex: 1, border: 'none', width: '100%' }} title="Cases" />
          </div>
        ) : currentStage.url ? (
          <iframe key={currentStage.key} src={`${APP_BASE}${currentStage.url}`} style={{ flex: 1, border: 'none', width: '100%' }} title={currentStage.label} />
        ) : currentStage.key === 'math' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
              <div style={{ fontSize: 40 }}>🧮</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1813', marginTop: 16, marginBottom: 8 }}>The Math</h3>
              <p style={{ fontSize: 14, color: '#615D52', lineHeight: 1.65 }}>Rep delivers ROI calculation here.</p>
            </div>
          </div>
        ) : currentStage.key === 'close' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
              <div style={{ fontSize: 40 }}>🎯</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1813', marginTop: 16, marginBottom: 8 }}>Close</h3>
              <p style={{ fontSize: 14, color: '#615D52', lineHeight: 1.65 }}>Checkout link and onboarding calendar shown here.</p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center', maxWidth: 360 }}>
              <div style={{ fontSize: 40 }}>👋</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1813', marginTop: 16, marginBottom: 8 }}>Discovery</h3>
              <p style={{ fontSize: 14, color: '#615D52', lineHeight: 1.65 }}>Rep asks discovery questions here. No product shown yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}