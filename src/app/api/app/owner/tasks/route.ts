import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { requireOwnerSession } from '@/utilities/requireOwnerSession'

const MAX_TARGET_QTY = 100000

/**
 * Створення нової задачі з режиму власника. Мінімум полів — назва й ціль;
 * date required у схемі, але на видимість на планшеті вже не впливає
 * (лише completedAt), тому підставляємо "зараз" без жодної логіки
 * планування.
 */
export async function POST(req: NextRequest) {
  const gate = await requireOwnerSession()
  if (gate.response) return gate.response

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

  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'INVALID_INPUT', field: 'title' }, { status: 400 })
  }
  if (
    typeof targetQty !== 'number' ||
    !Number.isInteger(targetQty) ||
    targetQty < 1 ||
    targetQty > MAX_TARGET_QTY
  ) {
    return NextResponse.json({ error: 'INVALID_INPUT', field: 'targetQty' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const task = await payload.create({
    collection: 'tasks',
    data: {
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : undefined,
      targetQty,
      taskType: 'production',
      date: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true, id: task.id })
}
