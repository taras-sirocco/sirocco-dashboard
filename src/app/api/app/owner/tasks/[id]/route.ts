import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { requireOwnerSession } from '@/utilities/requireOwnerSession'

const MAX_TARGET_QTY = 100000

/**
 * Редагування назви/опису/цілі з режиму власника. Приймає будь-яку
 * підмножину трьох полів — степер картки шле лише targetQty, форма
 * олівця шле title+description.
 *
 * КРИТИЧНО: якщо цілі піднімають вище вже накопиченого прогресу на
 * задачі, яка вже закрита (completedAt проставлено tasks/progress-роутом
 * при перетині старої цілі) — задача сама НЕ "воскресне": весь код читає
 * видимість виключно з completedAt (lib/tasks.ts: exists:false), а
 * ніщо ніде його не чистить автоматично. Тому саме тут, і тільки тут,
 * свідомо чистимо completedAt, коли новий targetQty > фактичний прогрес.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireOwnerSession()
  if (gate.response) return gate.response

  const { id } = await params
  const taskId = Number(id)
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { title, description, targetQty } = (body ?? {}) as {
    title?: unknown
    description?: unknown
    targetQty?: unknown
  }

  const data: { title?: string; description?: string; targetQty?: number; completedAt?: null } = {}

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'INVALID_INPUT', field: 'title' }, { status: 400 })
    }
    data.title = title.trim()
  }
  if (description !== undefined) {
    data.description = typeof description === 'string' ? description.trim() : ''
  }
  if (targetQty !== undefined) {
    if (
      typeof targetQty !== 'number' ||
      !Number.isInteger(targetQty) ||
      targetQty < 1 ||
      targetQty > MAX_TARGET_QTY
    ) {
      return NextResponse.json({ error: 'INVALID_INPUT', field: 'targetQty' }, { status: 400 })
    }
    data.targetQty = targetQty
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const task = await payload.findByID({ collection: 'tasks', id: taskId, overrideAccess: true }).catch(() => null)
  if (!task) {
    return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
  }

  if (typeof data.targetQty === 'number' && task.completedAt) {
    const { docs: progress } = await payload.find({
      collection: 'taskProgress',
      where: { task: { equals: taskId } },
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    })
    const totalDone = progress.reduce((sum, p) => sum + p.qtyDelta, 0)
    if (data.targetQty > totalDone) {
      data.completedAt = null
    }
  }

  await payload.update({ collection: 'tasks', id: taskId, data, overrideAccess: true })

  return NextResponse.json({ ok: true })
}
