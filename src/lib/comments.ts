import { getPayload } from 'payload'

import config from '@/payload.config'

import { getTodayShift } from './shifts'

export type CommentEntry = {
  id: number
  createdAt: string
  contextType: 'task' | 'step' | 'general'
  text: string
}

/** Коментарі сьогоднішньої зміни, найстаріші перші — показуємо як є, не переписуємо. */
export async function getTodayComments(): Promise<CommentEntry[]> {
  const shift = await getTodayShift()
  if (!shift) return []

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'comments',
    where: { shift: { equals: shift.id } },
    sort: 'createdAt',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  })

  return docs.map((doc) => ({
    id: doc.id,
    createdAt: doc.createdAt,
    contextType: doc.contextType ?? 'general',
    text: doc.text ?? '',
  }))
}
