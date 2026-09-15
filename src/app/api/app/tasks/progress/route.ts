import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Записує інкремент "+N шт" до задачі (taskProgress), НЕ перезаписує одне
 * число — так історію можна відновити (і додати unitIds пізніше). Зберігаємо
 * введену кількість як є, без обрізання по цілі — обрізання для показу
 * прогресу робиться лише при читанні (lib/tasks.ts).
 */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { taskId, qty } = (body ?? {}) as { taskId?: unknown; qty?: unknown }
  if (typeof taskId !== 'number' || typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 500) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const task = await payload
    .findByID({ collection: 'tasks', id: taskId, overrideAccess: true })
    .catch(() => null)
  if (!task) {
    return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
  }
  // Задача більше не "прострочена по даті" — гейт лише "існує і не закрита".
  // Закрита (completedAt проставлено) не приймає новий прогрес, навіть перебір.
  if (task.completedAt) {
    return NextResponse.json({ error: 'TASK_CLOSED' }, { status: 409 })
  }

  await payload.create({
    collection: 'taskProgress',
    data: {
      task: taskId,
      shift: shift.id,
      worker: session.workerId,
      qtyDelta: qty,
    },
    overrideAccess: true,
  })

  // Закриття по лічильнику: рахуємо суму ВСІХ інкрементів (не довіряємо
  // клієнтському "done" — офлайн-черга могла принести кілька одразу),
  // і якщо перетнули ціль — проставляємо completedAt один раз. Перебір
  // (10 при цілі 9) закриває так само, як і рівно 9 — поріг це >=.
  const { docs: allProgress } = await payload.find({
    collection: 'taskProgress',
    where: { task: { equals: taskId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const totalDone = allProgress.reduce((sum, p) => sum + p.qtyDelta, 0)

  if (totalDone >= task.targetQty) {
    await payload.update({
      collection: 'tasks',
      id: taskId,
      data: { completedAt: new Date().toISOString() },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true, done: totalDone, closed: totalDone >= task.targetQty })
}
