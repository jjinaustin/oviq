'use client'
import { useState, useEffect, useRef } from 'react'

const STAGES = [
  { key: 'discovery', label: 'Discovery', url: null, repCue: null },
  { key: 'dashboard', label: 'Dashboard', url: '/dashboard', repCue: 'Take a look at the screen on your right. This is what your ops manager sees every morning instead of digging through the TMS. Those three cards — Needs Judgment, Auto-resolving, and Handled Today. Right now 3 exceptions are being handled automatically. Your team has not touched any of them. When you are ready, click Next.' },
  { key: 'cases', label: 'Cases', url: '/cases', repCue: 'Every exception is a Case. You can see all of them at once — red means it needs your attention, teal means Oviq is actively handling it. Your team never has to dig through the TMS to find problems. Go ahead and click Next and I will show you exactly what is happening inside one of these cases.' },
  { key: 'case_detail', label: 'Case Detail', url: '/cases', repCue: 'Click on the first case in the list on your screen to open it. Once it opens, scroll down to the timeline and take a moment to read through it. When you are finished reviewing the timeline, click Next.' },
  { key: 'communications', label: 'Communications', url: '/cases/c45fd008-3921-4d1b-b22c-9e38d61661be', repCue: 'This is the actual email Oviq sent — professional, specific, references the load number and route. It comes from your branded address so the carrier thinks they are talking to your team. When the carrier responds it comes straight back here. Click Next to see what happens when the carrier goes dark.' },
  { key: 'escalation', label: 'Escalation', url: '/cases/c45fd008-3921-4d1b-b22c-9e38d61661be', repCue: 'This is important. Oviq does not try to handle everything. When the carrier goes dark after two hours it escalates immediately with everything already loaded. Your team only sees what actually needs them. Click Next.' },
  { key: 'ingest', label: 'Your Data', url: '/ingest', repCue: 'You can see the email address on the screen — copy that and send your TMS export there. Oviq will find your exceptions in under a minute. Click Next and I will show you what this means in real numbers.' },
  { key: 'math', label: 'The Math', url: null, repCue: 'Let me show you what this means for your operation specifically.' },
  { key: 'close', label: 'Next Steps', url: null, repCue: null },
]

const APP_BASE = 'https://app.oviq.io'
const CUE_DELAY_MS = 1500

export default function SyncTester() {
  const [stageIndex, setStageIndex] = useState(0)
  const [log, setLog] = useState([])
  const [cueCountdown, setCueCountdown] = useState(null)
  const advancingRef = useRef(false)
  const timerRef = useRef(null)
  const countdownRef = useRef(null)
  const logEndRef = useRef(null)

  const currentStage = STAGES[stageIndex]
  const isLast = stageIndex === STAGES.length - 1

  function addLog(type, text) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLog(prev => [...prev, { time, type, text }])
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function advance() {
    if (isLast || advancingRef.current) return
    advancingRef.current = true
    setTimeout(() => { advancingRef.current = false }, 4000)
    const nextStage = STAGES[stageIndex + 1]
    addLog('click', 'Next clicked → advancing to "' + nextStage.label + '"')
    setStageIndex(i => i + 1)
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setStageIndex(0)
    setLog([{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), type: 'system', text: 'Reset — starting from Discovery' }])
    setCueCountdown(null)
    advancingRef.current = false
  }

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    setCueCountdown(null)
    if (!currentStage.repCue || currentStage.key === 'discovery') return

    addLog('stage', '"' + currentStage.label + '" loaded — cue fires in ' + CUE_DELAY_MS + 'ms')

    let remaining = CUE_DELAY_MS
    setCueCountdown(remaining)
    countdownRef.current = setInterval(() => {
      remaining -= 100
      setCueCountdown(remaining)
      if (remaining <= 0 && countdownRef.current) clearInterval(countdownRef.current)
    }, 100)

    timerRef.current = setTimeout(() => {
      setCueCountdown(null)
      addLog('rep', currentStage.repCue)
    }, CUE_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [currentStage.key])

  const logColors = { click: '#D4A042', stage: '#6B7280', rep: '#0E8E7C', system: '#9C968A' }

  function renderProduct() {
    switch(currentStage.key) {
      case 'discovery':
        return (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>👋</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1813', marginTop: 16 }}>Discovery</h3>
              <p style={{ fontSize: 14, color: '#615D52' }}>Rep asks discovery questions. No product shown yet.</p>
            </div>
          </div>
        )
      case 'case_detail':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', background: '#0E8E7C', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>👆 Click on the first case in the list to open it. Scroll down to the timeline. Click Next when done.</span>
            </div>
            <iframe src={APP_BASE + '/cases'} style={{ flex: 1, border: 'none', width: '100%' }} title="Cases" />
          </div>
        )
      case 'communications':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', background: '#0E8E7C', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>📧 Review the Communications tab on this case — see the email Oviq sent and the carrier reply.</span>
            </div>
            <iframe src={APP_BASE + '/cases/c45fd008-3921-4d1b-b22c-9e38d61661be'} style={{ flex: 1, border: 'none', width: '100%' }} title="Case Communications" />
          </div>
        )
      case 'escalation':
        return (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', background: '#1A1813', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>⚡ Review the Timeline tab — see the escalation event at the bottom.</span>
            </div>
            <iframe src={APP_BASE + '/cases/c45fd008-3921-4d1b-b22c-9e38d61661be'} style={{ flex: 1, border: 'none', width: '100%' }} title="Case Escalation" />
          </div>
        )
      case 'math':
        return (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>🧮</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1813', marginTop: 16 }}>The Math</h3>
              <p style={{ fontSize: 14, color: '#615D52' }}>Rep delivers ROI calculation here.</p>
            </div>
          </div>
        )
      case 'close':
        return (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48 }}>🎯</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1813', marginTop: 16 }}>Close</h3>
              <p style={{ fontSize: 14, color: '#615D52' }}>Checkout link and onboarding calendar shown here.</p>
            </div>
          </div>
        )
      default:
        return currentStage.url
          ? <iframe key={currentStage.key} src={APP_BASE + currentStage.url} style={{ flex: 1, border: 'none', width: '100%' }} title={currentStage.label} />
          : null
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#F7F5EF' }}>
      <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #E7E2D5', background: '#fff' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E7E2D5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1813' }}>Sync Tester</div>
            <div style={{ fontSize: 11, color: '#9C968A', marginTop: 2 }}>No Tavus credits used</div>
          </div>
          <button onClick={reset} style={{ padding: '6px 12px', background: '#F7F5EF', border: '1px solid #E7E2D5', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#615D52' }}>Reset</button>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E7E2D5', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {STAGES.map((s, i) => (
            <div key={s.key} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: i === stageIndex ? '#0E8E7C' : i < stageIndex ? '#EAF3F0' : '#F7F5EF', color: i === stageIndex ? '#fff' : i < stageIndex ? '#0E8E7C' : '#9C968A' }}>{s.label}</div>
          ))}
        </div>
        {cueCountdown !== null && cueCountdown > 0 && (
          <div style={{ padding: '10px 20px', background: '#FFF8ED', borderBottom: '1px solid #E7E2D5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A042' }} />
            <span style={{ fontSize: 12, color: '#D4A042', fontWeight: 600 }}>Rep cue fires in {(cueCountdown / 1000).toFixed(1)}s…</span>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {log.length === 0 && <div style={{ fontSize: 13, color: '#9C968A', textAlign: 'center', marginTop: 40 }}>Click Next to start.<br />Watch this log to verify sync timing.</div>}
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
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E7E2D5' }}>
          <button onClick={advance} disabled={isLast} style={{ width: '100%', padding: '12px', background: isLast ? '#E7E2D5' : '#0E8E7C', color: isLast ? '#9C968A' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: isLast ? 'not-allowed' : 'pointer' }}>
            {isLast ? 'Demo complete' : 'Next → ' + (stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1].label : '')}
          </button>
          <div style={{ fontSize: 11, color: '#9C968A', textAlign: 'center', marginTop: 8 }}>Stage {stageIndex + 1} of {STAGES.length}</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: '#fff', borderBottom: '1px solid #E7E2D5', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0E8E7C', background: '#EAF3F0', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>{currentStage.label}</span>
          <span style={{ fontSize: 11, color: '#9C968A' }}>{currentStage.url ? 'app.oviq.io' + currentStage.url : 'no product screen'}</span>
        </div>
        {renderProduct()}
      </div>
    </div>
  )
}
