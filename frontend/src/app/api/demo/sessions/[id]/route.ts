import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function buildOpeningContext(session: {
  prospect_name: string; brokerage_name: string | null
  loads_per_month: number | null; tms_platform: string | null; biggest_pain: string | null
}): string {
  const { prospect_name, brokerage_name, loads_per_month, tms_platform, biggest_pain } = session
  const lines = [
    `You are starting a 30-minute automated demo call with ${prospect_name}${brokerage_name ? ` from ${brokerage_name}` : ''}.`,
    ``, `WHAT YOU KNOW FROM THEIR BOOKING:`,
  ]
  if (loads_per_month) lines.push(`- They move approximately ${loads_per_month.toLocaleString()} loads per month.`)
  if (tms_platform)    lines.push(`- Their TMS is ${tms_platform}.`)
  if (biggest_pain)    lines.push(`- Their stated biggest pain: "${biggest_pain}"`)
  if (!loads_per_month && !tms_platform && !biggest_pain)
    lines.push(`- No intake data provided — run full discovery to capture their situation.`)
  lines.push(``, `INSTRUCTIONS:`)
  lines.push(`Begin with Stage 0: Discovery. Greet ${prospect_name} by name. Even if you already have some context from their booking, confirm and deepen it with the four discovery questions.`)
  lines.push(`Use their exact words about pain points as ammunition throughout the demo.`)
  if (loads_per_month) {
    const exceptions = Math.round(loads_per_month * 0.1)
    const hours = Math.round(exceptions * (20 / 60))
    const saved = Math.round(hours * 0.8)
    const laborSavings = Math.round(saved * 37.5)
    lines.push(``, `MATH READY FOR STAGE 9:`)
    lines.push(`${loads_per_month.toLocaleString()} loads → ${exceptions} exceptions → ${hours} hrs/mo → Oviq saves ${saved} hrs → ~$${laborSavings.toLocaleString()}/mo at $37.50/hr`)
  }
  return lines.join('\n')
}

async function createTavusConversation(session: {
  id: string; prospect_name: string; brokerage_name: string | null
  loads_per_month: number | null; tms_platform: string | null; biggest_pain: string | null
}): Promise<{ conversation_id: string; conversation_url: string }> {
  const context = buildOpeningContext(session)
  const res = await fetch('https://tavusapi.com/v2/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TAVUS_API_KEY! },
    body: JSON.stringify({
      replica_id:             process.env.TAVUS_REPLICA_ID!,
      persona_id:             process.env.TAVUS_PERSONA_ID!,
      conversation_name:      `Oviq Demo — ${session.prospect_name}${session.brokerage_name ? ` · ${session.brokerage_name}` : ''}`,
      conversational_context: context,
    callback_url: `${process.env.NEXT_PUBLIC_DEMO_BASE_URL}/api/demo/webhook`,
      test_mode:    process.env.TAVUS_TEST_MODE === 'true',
    properties: {
    max_call_duration: 2400, enable_recording: true,
    participant_absent_timeout: 300, participant_left_timeout: 120,
    },
    }),
  })
  if (!res.ok) throw new Error(`Tavus API error: ${await res.text()}`)
  const data = await res.json()
  return { conversation_id: data.conversation_id, conversation_url: data.conversation_url }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: session, error: fetchError } = await supabase
    .from('demo_sessions').select('*').eq('session_token', params.id).single()

  if (fetchError || !session)
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  if (session.conversation_url) {
    return NextResponse.json({
      prospect_name: session.prospect_name, brokerage_name: session.brokerage_name,
      scheduled_at: session.scheduled_at, conversation_url: session.conversation_url,
      status: session.status,
    })
  }

  let tavus: { conversation_id: string; conversation_url: string }
  try {
    tavus = await createTavusConversation(session)
  } catch (err) {
    console.error('Tavus conversation creation failed:', err)
    return NextResponse.json({ error: 'Could not start video session. Please refresh or contact support.' }, { status: 500 })
  }

  await supabase.from('demo_sessions').update({
    conversation_id: tavus.conversation_id, conversation_url: tavus.conversation_url,
    conversation_created_at: new Date().toISOString(),
    joined_at: new Date().toISOString(), status: 'active',
  }).eq('id', session.id)

  return NextResponse.json({
    prospect_name: session.prospect_name, brokerage_name: session.brokerage_name,
    scheduled_at: session.scheduled_at, conversation_url: tavus.conversation_url,
    status: 'active',
  })
}