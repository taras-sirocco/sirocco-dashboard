import { getPayload } from 'payload'

import config from '@/payload.config'

export function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Сьогоднішня зміна (є щонайбільше одна на день — один відповідальний на дільницю). */
export async function getTodayShift() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { start, end } = todayRange()

  const { docs } = await payload.find({
    collection: 'shifts',
    where: { date: { greater_than_equal: start, less_than: end } },
    limit: 1,
    overrideAccess: true,
  })

  return docs[0] ?? null
}
