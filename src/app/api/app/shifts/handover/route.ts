import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Останнє питання відкриття: чи прийнято робоче місце. "Так" остаточно
 * відкриває зміну (openedAt). "Ні" лишає зміну невідкритою і створює
 * термінове повідомлення (blockers, kind: not_ready) для Тараса й бригадира.
 */
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

  const { shiftId, accepted, note } = (body ?? {}) as {
    shiftId?: unknown
    accepted?: unknown
    note?: unknown
  }

  if (typeof shiftId !== 'number' || typeof accepted !== 'boolean') {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  if (accepted) {
    await payload.update({
      collection: 'shifts',
      id: shiftId,
      data: { handoverOk: true, openedAt: new Date().toISOString() },
      overrideAccess: true,
    })
    return NextResponse.json({ ok: true })
  }

  const noteText = typeof note === 'string' ? note : undefined

  await payload.update({
    collection: 'shifts',
    id: shiftId,
    data: { handoverOk: false, handoverNote: noteText },
    overrideAccess: true,
  })

  await payload.create({
    collection: 'blockers',
    data: {
      kind: 'not_ready',
      shift: shiftId,
      worker: session.workerId,
      text: noteText,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}
