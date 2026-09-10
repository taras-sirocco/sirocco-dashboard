import { getPayload } from 'payload'

import config from '@/payload.config'

export type ChangesLogEntry = {
  id: number
  date: string
  whatWasSaid: string
  whatChanged: string
}

/**
 * Список «що змінили» — найновіші перші.
 *
 * `newCount` — НАБЛИЖЕННЯ: записи за останні 7 днів, не справжнє
 * "непереглянуте цим працівником". Правильне відстеження прочитаного
 * потребує окремого поля/колекції (напр. workers.lastSeenChangesAt), якого
 * зараз немає в моделі даних — свідомо не додаю це в середині екрана хаба,
 * винесено як окремий пункт для наступного рішення.
 */
export async function getChangesLog(): Promise<{ entries: ChangesLogEntry[]; newCount: number }> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'changesLog',
    sort: '-date',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const entries = docs.map((doc) => ({
    id: doc.id,
    date: doc.date,
    whatWasSaid: doc.whatWasSaid,
    whatChanged: doc.whatChanged,
  }))

  const newCount = entries.filter((entry) => new Date(entry.date) >= sevenDaysAgo).length

  return { entries, newCount }
}
