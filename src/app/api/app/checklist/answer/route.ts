import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/** Записує одну відповідь чек-листа. Закриває проходження, коли відповіли на всі пункти. */
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

  const { runId, itemKey, status, note } = (body ?? {}) as {
    runId?: unknown
    itemKey?: unknown
    status?: unknown
    note?: unknown
  }

  if (
    typeof runId !== 'number' ||
    typeof itemKey !== 'string' ||
    (status !== 'ok' && status !== 'problem')
  ) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const run = await payload.findByID({
    collection: 'checklistRuns',
    id: runId,
    overrideAccess: true,
  })
  if (!run) {
    return NextResponse.json({ error: 'RUN_NOT_FOUND' }, { status: 404 })
  }

  await payload.create({
    collection: 'checklistAnswers',
    data: {
      run: runId,
      itemKey,
      status,
      note: typeof note === 'string' ? note : undefined,
      answeredAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  const templateId = typeof run.template === 'object' ? run.template.id : run.template
  const template = await payload.findByID({
    collection: 'checklistTemplates',
    id: templateId,
    overrideAccess: true,
  })
  const totalItems = template.items?.length ?? 0

  const answeredCount = await payload.count({
    collection: 'checklistAnswers',
    where: { run: { equals: runId } },
    overrideAccess: true,
  })

  if (totalItems > 0 && answeredCount.totalDocs >= totalItems) {
    await payload.update({
      collection: 'checklistRuns',
      id: runId,
      data: { completedAt: new Date().toISOString() },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true })
}
