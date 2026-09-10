import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export type PendingBroadcast = {
  id: number
  kind: 'message' | 'task'
  body: string
  extra: string
  fromLabel: string
}

/** Непідтверджені цим працівником повідомлення/задачі, найстаріші перші (по черзі). */
export async function GET() {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const ackedByThisWorker = await payload.find({
    collection: 'broadcastAcks',
    where: { and: [{ worker: { equals: session.workerId } }, { ackedAt: { exists: true } }] },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const ackedBroadcastIds = ackedByThisWorker.docs.map((doc) =>
    typeof doc.broadcast === 'object' ? doc.broadcast.id : doc.broadcast,
  )

  const [{ docs }, strings] = await Promise.all([
    payload.find({
      collection: 'broadcasts',
      where: ackedBroadcastIds.length > 0 ? { id: { not_in: ackedBroadcastIds } } : undefined,
      sort: 'createdAt',
      limit: 50,
      depth: 1,
      overrideAccess: true,
    }),
    getUiStrings(['hub']),
  ])

  const items: PendingBroadcast[] = docs.map((doc) => {
    const sender = doc.createdBy
    let senderName = ''
    if (sender && typeof sender.value === 'object') {
      senderName =
        sender.relationTo === 'users'
          ? (sender.value.name ?? sender.value.email ?? '')
          : (sender.value.name ?? '')
    }
    const fromLabel =
      sender?.relationTo === 'users'
        ? t(strings, 'hub.modal_from_admin_template', { name: senderName })
        : t(strings, 'hub.modal_from_foreman_template', { name: senderName })

    return {
      id: doc.id,
      kind: doc.kind,
      body: doc.body,
      extra: doc.extra ?? '',
      fromLabel,
    }
  })

  return NextResponse.json({ items })
}
