import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift, todayRange } from '@/lib/shifts'
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

  // Задача має належати сьогоднішньому дню — планшет не може записати
  // прогрес у чужу/майбутню/минулу задачу підміною taskId.
  const { start, end } = todayRange()
  const task = await payload
    .findByID({ collection: 'tasks', id: taskId, overrideAccess: true })
    .catch(() => null)
  if (!task || task.date < start || task.date >= end) {
    return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
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

  return NextResponse.json({ ok: true })
}
