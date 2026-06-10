'use client'
import { useState } from 'react'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ContactPage() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', company: '', load_volume: '', tms: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${API}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--border-2)',
    borderRadius: '8px', padding: '11px 14px',
    fontSize: '14px', color: 'var(--text)', outline: 'none', width: '100%',
    fontFamily: "'Hanken Grotesk', sans-serif",
  }
  const labelStyle = { fontSize: '12px', fontWeight: 600 as const, color: 'var(--text-2)', letterSpacing: '0.02em' }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <MarketingNav />
      <div className="pt-16" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 64px)' }}>
        <div className="flex flex-col justify-center px-16 py-20 border-r" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--aqua)' }}>Book a demo</p>
          <h1 className="font-extrabold mb-4" style={{ fontSize: 'clamp(30px, 3.5vw, 44px)', letterSpacing: '-0.035em', lineHeight: 1.15, color: 'var(--text)' }}>
            See Oviq handle<br />a real <span style={{ color: 'var(--aqua)' }}>exception.</span>
          </h1>
          <p className="text-base mb-10" style={{ color: 'var(--text-2)', lineHeight: 1.7, maxWidth: '400px' }}>
            30 minutes. We'll walk through a live shipment exception from detection to resolution — using your own data if you'd like.
          </p>
          <div className="space-y-5">
            {[
              { title: 'Live walkthrough', desc: 'See exception detection, case creation, AI resolution, and escalation in real time.' },
              { title: 'Bring your CSV', desc: 'Upload a real export from your TMS and see Oviq detect exceptions in your actual data.' },
              { title: '30 minutes flat', desc: 'No pitch deck. No fluff. Just the product and your questions.' },
            ].map(({ title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--aqua)' }} />
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-2)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center px-16 py-20">
          {success ? (
            <div className="flex flex-col items-center text-center py-12">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ background: 'var(--aqua-dim)', border: '1px solid rgba(39,201,182,0.3)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--aqua)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Request received.</h3>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>We'll follow up within one business day to schedule your demo.</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>Request a demo</h2>
              <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>We'll follow up within one business day to schedule.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label style={labelStyle}>First name</label>
                    <input type="text" required value={form.first_name} onChange={e => update('first_name', e.target.value)} placeholder="Alex" style={inputStyle} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={labelStyle}>Last name</label>
                    <input type="text" required value={form.last_name} onChange={e => update('last_name', e.target.value)} placeholder="Chen" style={inputStyle} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Work email</label>
                  <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="alex@yourcompany.com" style={inputStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Company</label>
                  <input type="text" required value={form.company} onChange={e => update('company', e.target.value)} placeholder="Your freight brokerage or 3PL" style={inputStyle} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Monthly load volume</label>
                  <select value={form.load_volume} onChange={e => update('load_volume', e.target.value)} style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}>
                    <option value="" disabled>Select range</option>
                    <option>Under 100 loads / month</option>
                    <option>100–500 loads / month</option>
                    <option>500–2,000 loads / month</option>
                    <option>2,000–10,000 loads / month</option>
                    <option>10,000+ loads / month</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>TMS you're currently using</label>
                  <select value={form.tms} onChange={e => update('tms', e.target.value)} style={{ ...inputStyle, appearance: 'none' as const, cursor: 'pointer' }}>
                    <option value="" disabled>Select TMS</option>
                    <option>McLeod</option><option>Aljex</option><option>Ascend TMS</option>
                    <option>Turvo</option><option>Rose Rocket</option><option>Other / custom</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label style={labelStyle}>Anything you'd like us to know? (optional)</label>
                  <textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Biggest exception pain points, team size, specific questions..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-lg text-sm font-bold disabled:opacity-50"
                  style={{ background: 'var(--aqua)', color: 'var(--slate-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? 'Sending...' : 'Request demo →'}
                </button>
                <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>No spam. No sales sequences. Just a 30-minute conversation.</p>
              </form>
            </>
          )}
        </div>
      </div>
      <MarketingFooter />
    </div>
  )
}
