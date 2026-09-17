import { getPayload } from 'payload'

import config from '@/payload.config'

import { getTodayShift } from './shifts'

export type CommentEntry = {
  id: number
  createdAt: string
  contextType: 'task' | 'step' | 'general'
  text: string
}

async function findCommentsForShift(shiftId: number): Promise<CommentEntry[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'comments',
    where: { shift: { equals: shiftId } },
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

/** Коментарі сьогоднішньої зміни, найстаріші перші — показуємо як є, не переписуємо. */
export async function getTodayComments(): Promise<CommentEntry[]> {
  const shift = await getTodayShift()
  if (!shift) return []
  return findCommentsForShift(shift.id)
}

/**
 * Те саме, але для КОНКРЕТНОЇ (в т.ч. вже закритої/минулої) зміни — для
 * зведеного звіту власника. getTodayComments лишається без змін для
 * потоку монтажника.
 */
export async function getShiftComments(shiftId: number): Promise<CommentEntry[]> {
  return findCommentsForShift(shiftId)
}
