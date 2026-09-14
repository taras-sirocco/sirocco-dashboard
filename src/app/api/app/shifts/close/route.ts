import { NextResponse, after } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { notifyReport } from '@/lib/slack/notify'
import { getTodayShift } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Остаточне закриття зміни. Перевіряє на сервері (не довіряючи стану
 * кнопки на клієнті), що чек-лист закриття повний і всі обов'язкові
 * фото прикріплені — без цього зміна не закривається.
 */
export async function POST() {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }
  if (shift.closedAt) {
    return NextResponse.json({ ok: true, closedAt: shift.closedAt, name: session.name })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const template = await payload
    .find({
      collection: 'checklistTemplates',
      where: { type: { equals: 'closing' } },
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)
  if (!template) {
    return NextResponse.json({ error: 'NO_TEMPLATE' }, { status: 500 })
  }

  // Лише незавершений run поточного циклу — завершений належить
  // попередньому закриттю (той самий день, зміну відкрили знову).
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

  const answers = run
    ? await payload
        .find({
          collection: 'checklistAnswers',
          where: { run: { equals: run.id } },
          limit: 100,
          overrideAccess: true,
        })
        .then((res) => res.docs)
    : []

  const answerByKey = new Map(answers.map((a) => [a.itemKey, a]))
  const items = template.items ?? []

  const incomplete = items.filter((item) => {
    const answer = answerByKey.get(item.key)
    if (!answer || answer.status !== 'ok') return true
    if (item.requiresPhoto && !answer.photo) return true
    return false
  })

  if (incomplete.length > 0) {
    return NextResponse.json(
      { error: 'CHECKLIST_INCOMPLETE', missing: incomplete.map((i) => i.key) },
      { status: 409 },
    )
  }

  if (run) {
    await payload.update({
      collection: 'checklistRuns',
      id: run.id,
      data: { completedAt: new Date().toISOString() },
      overrideAccess: true,
    })
  }

  const closedAt = new Date().toISOString()
  await payload.update({
    collection: 'shifts',
    id: shift.id,
    data: { closedAt },
    overrideAccess: true,
  })

  after(async () => {
    const tasks = await getTodayTasksWithProgress()

    // «Що завадило» для недобору — окремі blockers (kind: gap), не в comments.
    // Одна на задачу, що недобрала ціль; підтягуємо тут же, щоб підсумок
    // закриття одразу ніс причину, а не лише голі цифри.
    const { docs: gapBlockers } = await payload.find({
      collection: 'blockers',
      where: { and: [{ kind: { equals: 'gap' } }, { shift: { equals: shift.id } }] },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })
    const reasonByTaskId = new Map<number, string>()
    for (const blocker of gapBlockers) {
      if (!blocker.text) continue
      const taskId = typeof blocker.task === 'object' ? blocker.task?.id : blocker.task
      if (typeof taskId === 'number') reasonByTaskId.set(taskId, blocker.text)
    }

    await notifyReport({
      kind: 'shift_closed',
      workerName: session.name,
      tasks: tasks.map((t) => ({
        title: t.title,
        done: t.done,
        targetQty: t.targetQty,
        reason: reasonByTaskId.get(t.id),
      })),
    })
  })

  return NextResponse.json({ ok: true, closedAt, name: session.name })
}
