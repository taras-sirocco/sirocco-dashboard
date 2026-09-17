import { getPayload } from 'payload'

import config from '@/payload.config'

export type ShiftChecklistItem = {
  key: string
  text: string
  requiresPhoto: boolean
  status: 'ok' | 'problem' | null
  note: string
  photoId: number | null
}

export type ShiftChecklistResult = {
  /** null — чек-лист цього типу для цієї зміни ще не завершено (або не проходили). */
  completedAt: string | null
  items: ShiftChecklistItem[]
}

/**
 * Чек-лист (відкриття або закриття) КОНКРЕТНОЇ зміни — для звіту власника
 * про вже минулу зміну, бере саме ЗАВЕРШЕНИЙ run (completedAt exists).
 *
 * Навмисно НЕ lib/closingChecklist.ts — той рідер для екрана монтажника й
 * фільтрує ПРОТИЛЕЖНЕ (незавершений run поточної зміни, щоб продовжити
 * заповнення). Тут потрібен готовий результат уже минулого проходження.
 */
export async function getShiftChecklist(
  shiftId: number,
  type: 'opening' | 'closing',
): Promise<ShiftChecklistResult> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const template = await payload
    .find({
      collection: 'checklistTemplates',
      where: { type: { equals: type } },
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)
  if (!template) return { completedAt: null, items: [] }

  const base: ShiftChecklistItem[] = (template.items ?? []).map((item) => ({
    key: item.key,
    text: item.text,
    requiresPhoto: item.requiresPhoto ?? false,
    status: null,
    note: '',
    photoId: null,
  }))

  const run = await payload
    .find({
      collection: 'checklistRuns',
      where: {
        and: [
          { shift: { equals: shiftId } },
          { template: { equals: template.id } },
          { completedAt: { exists: true } },
        ],
      },
      sort: '-completedAt',
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)
  if (!run) return { completedAt: null, items: base }

  const { docs: answers } = await payload.find({
    collection: 'checklistAnswers',
    where: { run: { equals: run.id } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const byKey = new Map(answers.map((a) => [a.itemKey, a]))

  return {
    completedAt: run.completedAt ?? null,
    items: base.map((item) => {
      const answer = byKey.get(item.key)
      if (!answer) return item
      return {
        ...item,
        status: answer.status,
        note: answer.note ?? '',
        photoId: typeof answer.photo === 'object' && answer.photo ? answer.photo.id : (answer.photo ?? null),
      }
    }),
  }
}
