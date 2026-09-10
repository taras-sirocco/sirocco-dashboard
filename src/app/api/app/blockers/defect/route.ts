import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Звірка з еталоном не пройдена — дефект не йде далі. Окремий вузький
 * роут (kind фіксовано "defect"), як і /blockers/critical.
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

  const { taskId, text } = (body ?? {}) as { taskId?: unknown; text?: unknown }
  if (typeof taskId !== 'number') {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  await payload.create({
    collection: 'blockers',
    data: {
      kind: 'defect',
      task: taskId,
      shift: shift.id,
      worker: session.workerId,
      text: typeof text === 'string' ? text : undefined,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}
