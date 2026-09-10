import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/** «Прочитано»/«Прийнято» — фіксує підтвердження, модалка після цього не повертається. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const { id } = await params
  const broadcastId = Number(id)
  if (!Number.isInteger(broadcastId)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const existing = await payload.find({
    collection: 'broadcastAcks',
    where: {
      and: [{ broadcast: { equals: broadcastId } }, { worker: { equals: session.workerId } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  const now = new Date().toISOString()

  if (existing.docs[0]) {
    await payload.update({
      collection: 'broadcastAcks',
      id: existing.docs[0].id,
      data: { ackedAt: now, shownAt: existing.docs[0].shownAt ?? now },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'broadcastAcks',
      data: { broadcast: broadcastId, worker: session.workerId, shownAt: now, ackedAt: now },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true })
}
