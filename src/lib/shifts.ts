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
 * Скільки годин незакрита зміна вважається реальною роботою, а не
 * забутою (планшет розрядився, пішли додому). Межа по годинах, не по
 * календарному дню — інакше ламається рівно опівночі для будь-чого, що
 * триває довше. Реальна зміна ніколи не триває стільки; якщо колись
 * зʼявляться нічні зміни, що самі по собі довші за це число — підняти.
 */
export const STALE_SHIFT_HOURS = 16

export function isShiftStale(shift: { createdAt: string }): boolean {
  const ageMs = Date.now() - new Date(shift.createdAt).getTime()
  return ageMs > STALE_SHIFT_HOURS * 60 * 60 * 1000
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
