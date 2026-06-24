import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

async function extractSignals(transcript: string): Promise<{
  confirmed_loads: number | null; confirmed_tms: string | null
  stages_reached: string[]; objections_raised: string[]
  expressed_interest: boolean; follow_up_notes: string
}> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 1000,
    messages: [{ role: 'user', content: `You are analyzing a sales demo call transcript for Oviq, a freight brokerage exception management platform. Extract the following and respond ONLY with valid JSON:\n{\n  "confirmed_loads": <integer or null>,\n  "confirmed_tms": <string or null>,\n  "stages_reached": <array of strings>,\n  "objections_raised": <array of strings>,\n  "expressed_interest": <boolean>,\n  "follow_up_notes": <string — 2-3 sentence summary>\n}\n\nTRANSCRIPT:\n${transcript}` }],
  })
  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return { confirmed_loads: null, confirmed_tms: null, stages_reached: [], objections_raised: [], expressed_interest: false, follow_up_notes: 'Transcript parsing failed — review manually.' }
  }
}

async function sendNotification(session: {
  prospect_name: string; brokerage_name: string | null; prospect_email: string
  confirmed_loads: number | null; expressed_interest: boolean
  follow_up_notes: string; call_duration_secs: number | null
}) {
  if (!process.env.RESEND_API_KEY) return
  const mins = session.call_duration_secs ? Math.round(session.call_duration_secs / 60) : null
  const subject = session.expressed_interest
    ? `🟢 Demo complete — ${session.prospect_name} is interested`
    : `Demo complete — ${session.prospect_name}`
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'Oviq Demo <demo@oviq.io>',
      to: process.env.DEMO_NOTIFICATION_EMAIL || 'johnston@oviq.io',
      subject,
      text: `Demo call completed.\n\nProspect: ${session.prospect_name}${session.brokerage_name ? ` · ${session.brokerage_name}` : ''}\nEmail: ${session.prospect_email}\nDuration: ${mins ? `${mins} minutes` : 'unknown'}\nLoads/mo: ${session.confirmed_loads?.toLocaleString() ?? 'not captured'}\nInterest: ${session.expressed_interest ? 'YES' : 'Not yet'}\n\nNotes:\n${session.follow_up_notes}`,
    }),
  })
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const payload = await req.json()
  const { event_type, conversation_id, properties } = payload

  if (event_type !== 'application.transcription_ready')
    return NextResponse.json({ ok: true, skipped: true })

  const { data: session, error: fetchError } = await supabase
    .from('demo_sessions').select('*').eq('conversation_id', conversation_id).single()

  if (fetchError || !session) {
    console.error('No session found for conversation_id:', conversation_id)
    return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 })
  }

  const messages: Array<{ role: string; content: string }> = properties?.transcript || []
  const transcriptText = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')
  const durationSecs: number | null = properties?.call_duration ?? null
  const signals = await extractSignals(transcriptText)

  await supabase.from('demo_sessions').update({
    transcript_raw: transcriptText, call_duration_secs: durationSecs,
    stages_reached: signals.stages_reached, objections_raised: signals.objections_raised,
    confirmed_loads: signals.confirmed_loads, confirmed_tms: signals.confirmed_tms,
    expressed_interest: signals.expressed_interest, follow_up_notes: signals.follow_up_notes,
    completed_at: new Date().toISOString(), status: 'completed',
  }).eq('id', session.id)

  await sendNotification({
    prospect_name: session.prospect_name, brokerage_name: session.brokerage_name,
    prospect_email: session.prospect_email, confirmed_loads: signals.confirmed_loads,
    expressed_interest: signals.expressed_interest, follow_up_notes: signals.follow_up_notes,
    call_duration_secs: durationSecs,
  })

  return NextResponse.json({ ok: true, session_id: session.id })
}