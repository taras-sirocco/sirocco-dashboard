import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Одна відповідь чек-листа закриття (toggle ok/problem, опційно фото).
 * Run для сьогоднішньої зміни резолвиться/створюється тут-таки — клієнт
 * не знає і не передає runId/shiftId, тільки itemKey.
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

  const { itemKey, status, mediaId } = (body ?? {}) as {
    itemKey?: unknown
    status?: unknown
    mediaId?: unknown
  }
  if (typeof itemKey !== 'string' || (status !== 'ok' && status !== 'problem')) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const template = await payload
    .find({
      collection: 'checklistTemplates',
      where: { type: { equals: 'closing' } },
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)
  if (!template) {
    return NextResponse.json({ error: 'NO_TEMPLATE' }, { status: 500 })
  }

  const existingRuns = await payload.find({
    collection: 'checklistRuns',
    where: { and: [{ shift: { equals: shift.id } }, { template: { equals: template.id } }] },
    limit: 1,
    overrideAccess: true,
  })
  const run =
    existingRuns.docs[0] ??
    (await payload.create({
      collection: 'checklistRuns',
      data: { shift: shift.id, template: template.id, templateVersion: template.version ?? 1 },
      overrideAccess: true,
    }))

  const existingAnswers = await payload.find({
    collection: 'checklistAnswers',
    where: { and: [{ run: { equals: run.id } }, { itemKey: { equals: itemKey } }] },
    limit: 1,
    overrideAccess: true,
  })

  const data: { status: 'ok' | 'problem'; photo?: number; answeredAt: string } = {
    status,
    photo: typeof mediaId === 'number' ? mediaId : undefined,
    answeredAt: new Date().toISOString(),
  }

  if (existingAnswers.docs[0]) {
    await payload.update({
      collection: 'checklistAnswers',
      id: existingAnswers.docs[0].id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'checklistAnswers',
      data: { run: run.id, itemKey, ...data },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true })
}
