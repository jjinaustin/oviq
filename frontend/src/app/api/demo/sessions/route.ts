import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Shared secret so random internet traffic can't create sessions ──
const WEBHOOK_SECRET = process.env.DEMO_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  // Verify shared secret from Zapier header
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const {
    prospect_name,
    prospect_email,
    brokerage_name,
    loads_per_month,
    tms_platform,
    biggest_pain,
    scheduled_at,
    timezone,
    calendly_event_id,
  } = body

  // Validate required fields
  if (!prospect_name || !prospect_email || !scheduled_at) {
    return NextResponse.json(
      { error: 'prospect_name, prospect_email, and scheduled_at are required' },
      { status: 400 }
    )
  }

  // Insert — if calendly_event_id already exists, return the existing session
  // (handles Zapier firing twice for the same booking)
  const { data, error } = await supabase
    .from('demo_sessions')
    .upsert(
      {
        prospect_name,
        prospect_email,
        brokerage_name:   brokerage_name   || null,
        loads_per_month:  loads_per_month  ? parseInt(loads_per_month) : null,
        tms_platform:     tms_platform     || null,
        biggest_pain:     biggest_pain     || null,
        scheduled_at,
        timezone:         timezone         || 'America/New_York',
        calendly_event_id,
        status:           'scheduled',
      },
      {
        onConflict: 'calendly_event_id',  // idempotent — safe to call twice
        ignoreDuplicates: false,           // return existing row if duplicate
      }
    )
    .select('id, session_token, prospect_name, scheduled_at')
    .single()

  if (error) {
    console.error('demo_sessions insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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