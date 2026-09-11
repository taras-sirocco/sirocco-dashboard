import { getPayload } from 'payload'

import config from '@/payload.config'

import { getChecklistTemplate } from './checklistTemplates'
import { getTodayShift } from './shifts'

export type ClosingChecklistItem = {
  key: string
  text: string
  requiresPhoto: boolean
  status: 'ok' | 'problem' | null
  photoId: number | null
}

/** Пункти закриття разом з уже збереженими відповідями (якщо повертались на екран). */
export async function getClosingChecklistState(): Promise<ClosingChecklistItem[]> {
  const template = await getChecklistTemplate('closing')
  if (!template) return []

  const base = template.items.map((item) => ({
    key: item.key,
    text: item.text,
    requiresPhoto: item.requiresPhoto,
    status: null as 'ok' | 'problem' | null,
    photoId: null as number | null,
  }))

  const shift = await getTodayShift()
  if (!shift) return base

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Лише незавершений run — завершений належить попередньому циклу
  // (зміну закрили й відкрили знову того самого дня), його старі
  // відповіді/фото тут показувати не треба, починаємо з чистого.
  const run = await payload
    .find({
      collection: 'checklistRuns',
      where: {
        and: [
          { shift: { equals: shift.id } },
          { template: { equals: template.id } },
          { completedAt: { exists: false } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)
  if (!run) return base

  const { docs: answers } = await payload.find({
    collection: 'checklistAnswers',
    where: { run: { equals: run.id } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const byKey = new Map(answers.map((a) => [a.itemKey, a]))

  return base.map((item) => {
    const answer = byKey.get(item.key)
    if (!answer) return item
    return {
      ...item,
      status: answer.status,
      photoId: typeof answer.photo === 'object' && answer.photo ? answer.photo.id : (answer.photo ?? null),
    }
  })
}
