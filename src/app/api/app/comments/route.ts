import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/** «Нотатка до процесу» — нейтральний запис, потрапляє в аркуш дня. */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { text } = (body ?? {}) as { text?: unknown }
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  await payload.create({
    collection: 'comments',
    data: {
      shift: shift.id,
      worker: session.workerId,
      text,
      contextType: 'general',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}
