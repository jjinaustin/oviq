import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function buildOpeningContext(data: {
  prospect_name: string; brokerage_name: string | null
  loads_per_month: number | null; tms_platform: string | null; biggest_pain: string | null
}): string {
  const { prospect_name, brokerage_name, loads_per_month, tms_platform, biggest_pain } = data
  const lines = [
    `You are starting a 15-minute automated demo call with ${prospect_name}${brokerage_name ? ` from ${brokerage_name}` : ''}.`,
    ``, `WHAT YOU KNOW FROM THEIR BOOKING:`,
  ]
  if (loads_per_month) lines.push(`- They move approximately ${loads_per_month.toLocaleString()} loads per month.`)
  if (tms_platform)    lines.push(`- Their TMS is ${tms_platform}.`)
  if (biggest_pain)    lines.push(`- Their stated biggest pain: "${biggest_pain}"`)
  if (!loads_per_month && !tms_platform && !biggest_pain)
    lines.push(`- No intake data provided — run full discovery to capture their situation.`)
  lines.push(``, `INSTRUCTIONS:`)
  lines.push(`Begin with Stage 0: Discovery. Greet ${prospect_name} by name. Keep discovery to 2 minutes maximum.`)
  lines.push(`Use their exact words about pain points as ammunition throughout the demo.`)
  if (loads_per_month) {
    let exceptionRate = 0.10
    let minsPerException = 20
    let hourlyRate = 50
    let planCost = 299
    if (loads_per_month < 300) {
      exceptionRate = 0.08; minsPerException = 15; hourlyRate = 50; planCost = 299
    } else if (loads_per_month < 500) {
      exceptionRate = 0.10; minsPerException = 20; hourlyRate = 50; planCost = 299
    } else if (loads_per_month < 5000) {
      exceptionRate = 0.12; minsPerException = 20; hourlyRate = 50; planCost = 799
    } else {
      exceptionRate = 0.15; minsPerException = 25; hourlyRate = 50; planCost = 1999
    }
    const exceptions   = Math.round(loads_per_month * exceptionRate)
    const hours        = Math.round(exceptions * (minsPerException / 60))
    const saved        = Math.round(hours * 0.8)
    const laborSavings = Math.round(saved * hourlyRate)
    const netSavings   = laborSavings - planCost
    lines.push(``, `MATH READY FOR STAGE 9:`)
    lines.push(`${loads_per_month.toLocaleString()} loads → ${exceptions} exceptions → ${hours} hrs/mo → Oviq saves ${saved} hrs → $${laborSavings.toLocaleString()} labor savings → minus $${planCost} plan = ~$${netSavings.toLocaleString()} net savings/mo`)
  }
  return lines.join('\n')
}

async function createTavusConversation(sessionData: {
  id: string; prospect_name: string; brokerage_name: string | null
  loads_per_month: number | null; tms_platform: string | null; biggest_pain: string | null
}): Promise<{ conversation_id: string; conversation_url: string }> {
  const context = buildOpeningContext(sessionData)
  const res = await fetch('https://tavusapi.com/v2/conversations', {
    method:  'POST',
    cache:   'no-store',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.TAVUS_API_KEY! },
    body: JSON.stringify({
      replica_id:             process.env.TAVUS_REPLICA_ID!,
      persona_id:             process.env.TAVUS_PERSONA_ID!,
      conversation_name:      `Oviq Demo — ${sessionData.prospect_name}${sessionData.brokerage_name ? ` · ${sessionData.brokerage_name}` : ''}`,
      conversational_context: context,
      callback_url:           `${process.env.NEXT_PUBLIC_DEMO_BASE_URL}/api/demo/webhook`,
      test_mode:              process.env.TAVUS_TEST_MODE === 'true',
      properties: {
        max_call_duration:          900,
        enable_recording:           true,
        participant_absent_timeout: 600,
        participant_left_timeout:   120,
      },
    }),
  })
  if (!res.ok) throw new Error(`Tavus API error: ${await res.text()}`)
  const data = await res.json()
  return { conversation_id: data.conversation_id, conversation_url: data.conversation_url }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const WEBHOOK_SECRET = process.env.DEMO_WEBHOOK_SECRET!

  const secret = req.headers.get('x-webhook-secret')
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    prospect_name, prospect_email, brokerage_name,
    loads_per_month, tms_platform, biggest_pain,
    scheduled_at, timezone, calendly_event_id,
  } = body

  if (!prospect_name || !prospect_email || !scheduled_at) {
    return NextResponse.json(
      { error: 'prospect_name, prospect_email, and scheduled_at are required' },
      { status: 400 }
    )
  }

  // 1. Create session row first
  const { data, error } = await supabase
    .from('demo_sessions')
    .upsert(
      {
        prospect_name,
        prospect_email,
        brokerage_name:  brokerage_name  || null,
        loads_per_month: loads_per_month ? parseInt(loads_per_month) : null,
        tms_platform:    tms_platform    || null,
        biggest_pain:    biggest_pain    || null,
        scheduled_at,
        timezone:        timezone        || 'America/New_York',
        calendly_event_id,
        status:          'scheduled',
      },
      { onConflict: 'calendly_event_id', ignoreDuplicates: false }
    )
    .select('id, session_token, prospect_name, scheduled_at, conversation_url')
    .single()

  if (error) {
    console.error('demo_sessions insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Create Tavus conversation immediately at booking time
  // so the room is fully initialized before the prospect joins
  if (!data.conversation_url) {
    try {
      const tavus = await createTavusConversation({
        id:             data.id,
        prospect_name,
        brokerage_name: brokerage_name || null,
        loads_per_month: loads_per_month ? parseInt(loads_per_month) : null,
        tms_platform:   tms_platform   || null,
        biggest_pain:   biggest_pain   || null,
      })

      await supabase
        .from('demo_sessions')
        .update({
          conversation_id:         tavus.conversation_id,
          conversation_url:        tavus.conversation_url,
          conversation_created_at: new Date().toISOString(),
        })
        .eq('id', data.id)

      const joinUrl = `${process.env.NEXT_PUBLIC_DEMO_BASE_URL}/join?session=${data.session_token}`
      return NextResponse.json({
        session_id:    data.id,
        session_token: data.session_token,
        join_url:      joinUrl,
        prospect_name: data.prospect_name,
        scheduled_at:  data.scheduled_at,
      })
    } catch (err) {
      console.error('Tavus conversation creation failed at booking time:', err)
      // Non-fatal — session is created, Tavus room will be created at join time as fallback
    }
  }

  const joinUrl = `${process.env.NEXT_PUBLIC_DEMO_BASE_URL}/join?session=${data.session_token}`
  return NextResponse.json({
    session_id:    data.id,
    session_token: data.session_token,
    join_url:      joinUrl,
    prospect_name: data.prospect_name,
    scheduled_at:  data.scheduled_at,
  })
}
