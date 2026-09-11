import { getPayload } from 'payload'

import config from '@/payload.config'

export function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Активна зараз зміна — відкрита (openedAt) і ще не закрита (closedAt).
 * НЕ прив'язана до календарного дня: відкрити й закрити зміну можна
 * скільки завгодно разів за день, кожен цикл — окремий запис у shifts.
 * Назва лишилась історичною (getTodayShift), сенс змінено навмисно.
 */
export async function getTodayShift() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'shifts',
    where: { and: [{ openedAt: { exists: true } }, { closedAt: { exists: false } }] },
    sort: '-openedAt',
    limit: 1,
    overrideAccess: true,
  })

  return docs[0] ?? null
}
