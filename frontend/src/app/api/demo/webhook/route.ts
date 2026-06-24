import { NextRequest, NextResponse } from 'next/server'

const TAVUS_API_KEY = process.env.TAVUS_API_KEY!

export async function PATCH(req: NextRequest) {
  const { conversationId, context } = await req.json()

  if (!conversationId || !context) {
    return NextResponse.json({ error: 'conversationId and context required' }, { status: 400 })
  }

  try {
    // Tavus supports injecting new context mid-conversation via conversation update
    const res = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify({
        conversational_context: context,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      // Non-fatal — log but don't break the demo flow
      console.error(`Tavus context update failed: ${err}`)
      return NextResponse.json({ ok: false, error: err }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Context update error:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}