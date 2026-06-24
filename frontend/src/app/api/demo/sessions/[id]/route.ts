import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TAVUS_API_KEY     = process.env.TAVUS_API_KEY!
const TAVUS_REPLICA_ID  = process.env.TAVUS_REPLICA_ID!
const TAVUS_PERSONA_ID  = process.env.TAVUS_PERSONA_ID!

// ── Build the opening context the AI rep receives ──────────────
function buildOpeningContext(session: {
  prospect_name:    string
  brokerage_name:   string | null
  loads_per_month:  number | null
  tms_platform:     string | null
  biggest_pain:     string | null
}): string {
  const { prospect_name, brokerage_name, loads_per_month, tms_platform, biggest_pain } = session

  const lines = [
    `You are starting a 30-minute automated demo call with ${prospect_name}${brokerage_name ? ` from ${brokerage_name}` : ''}.`,
    ``,
    `WHAT YOU KNOW FROM THEIR BOOKING:`,
  ]

  if (loads_per_month) lines.push(`- They move approximately ${loads_per_month.toLocaleString()} loads per month.`)
  if (tms_platform)    lines.push(`- Their TMS is ${tms_platform}.`)
  if (biggest_pain)    lines.push(`- Their stated biggest pain: "${biggest_pain}"`)

  if (!loads_per_month && !tms_platform && !biggest_pain) {
    lines.push(`- No intake data provided — run full discovery to capture their situation.`)
  }

  lines.push(``)
  lines.push(`INSTRUCTIONS:`)
  lines.push(`Begin with Stage 0: Discovery. Greet ${prospect_name} by name. Even if you already have some`)
  lines.push(`context from their booking, confirm and deepen it with the four discovery questions.`)
  lines.push(`Use their exact words about pain points as ammunition throughout the demo.`)

  if (loads_per_month) {
    // Pre-calculate math so rep can deliver it confidently
    const exceptions    = Math.round(loads_per_month * 0.1)
    const hours         = Math.round(exceptions * (20 / 60))
    const saved         = Math.round(hours * 0.8)
    const laborSavings  = Math.round(saved * 37.5)
    lines.push(``)
    lines.push(`MATH READY FOR STAGE 9:`)
    lines.push(`${loads_per_month.toLocaleString()} loads → ${exceptions} exceptions → ${hours} hrs/mo → Oviq saves ${saved} hrs → ~$${laborSavings.toLocaleString()}/mo at $37.50/hr`)
  }

  return lines.join('\n')
}

// ── Create a fresh Tavus conversation ─────────────────────────
async function createTavusConversation(session: {
  id:               string
  prospect_name:    string
  brokerage_name:   string | null
  loads_per_month:  number | null
  tms_platform:     string | null
  biggest_pain:     string | null
}): Promise<{ conversation_id: string; conversation_url: string }> {
  const context = buildOpeningContext(session)

  const res = await fetch('https://tavusapi.com/v2/conversations', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key':    TAVUS_API_KEY,
    },
    body: JSON.stringify({
      replica_id:             TAVUS_REPLICA_ID,
      persona_id:             TAVUS_PERSONA_ID,
      conversation_name:      `Oviq Demo — ${session.prospect_name}${session.brokerage_name ? ` · ${session.brokerage_name}` : ''}`,
      conversational_context: context,
      properties: {
        max_call_duration:          2400,   // 40 min ceiling
        enable_recording:           true,
        participant_absent_timeout: 300,    // end if prospect never shows after 5 min
        participant_left_timeout:   120,    // end 2 min after prospect leaves
        callback_url:               `${process.env.NEXT_PUBLIC_DEMO_BASE_URL}/api/demo/webhook`,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tavus API error: ${err}`)
  }

  const data = await res.json()
  return {
    conversation_id:  data.conversation_id,
    conversation_url: data.conversation_url,
  }
}

// ── Route handler ──────────────────────────────────────────────
export async function GET(
  req:     NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionToken = params.id

  // 1. Fetch session by token
  const { data: session, error: fetchError } = await supabase
    .from('demo_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single()

  if (fetchError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  // 2. If Tavus conversation already exists, return it
  //    (handles page refresh — don't create a second conversation)
  if (session.conversation_url) {
    return NextResponse.json({
      prospect_name:    session.prospect_name,
      brokerage_name:   session.brokerage_name,
      scheduled_at:     session.scheduled_at,
      conversation_url: session.conversation_url,
      status:           session.status,
    })
  }

  // 3. Create fresh Tavus conversation
  let tavus: { conversation_id: string; conversation_url: string }
  try {
    tavus = await createTavusConversation(session)
  } catch (err) {
    console.error('Tavus conversation creation failed:', err)
    return NextResponse.json(
      { error: 'Could not start video session. Please refresh or contact support.' },
      { status: 500 }
    )
  }

  // 4. Store conversation details and mark active
  const { error: updateError } = await supabase
    .from('demo_sessions')
    .update({
      conversation_id:          tavus.conversation_id,
      conversation_url:         tavus.conversation_url,
      conversation_created_at:  new Date().toISOString(),
      joined_at:                new Date().toISOString(),
      status:                   'active',
    })
    .eq('id', session.id)

  if (updateError) {
    console.error('Session update error:', updateError)
    // Non-fatal — still return the conversation URL to the prospect
  }

  return NextResponse.json({
    prospect_name:    session.prospect_name,
    brokerage_name:   session.brokerage_name,
    scheduled_at:     session.scheduled_at,
    conversation_url: tavus.conversation_url,
    status:           'active',
  })
}