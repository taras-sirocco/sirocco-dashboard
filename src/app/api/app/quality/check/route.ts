import { NextRequest, NextResponse, after } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { notifyReport } from '@/lib/slack/notify'
import { getTodayShift } from '@/lib/shifts'
import type { Task } from '@/payload-types'
import { getSessionWorker } from '@/utilities/getSessionWorker'

type CheckInput = { taskId: number; qtyAccepted: number; comment?: string }
type PreparedCheck = { check: CheckInput; task: Task; qtyDone: number; defect: number }

function formatShiftDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso))
}

/**
 * Перевірка якості бригадиром: скільки із заявленого монтажником по кожній
 * задачі ЦІЄЇ зміни приймається. qtyDone НІКОЛИ не береться з тіла запиту —
 * рахуємо самі із taskProgress (той самий принцип, що й у tasks/progress
 * та blockers/gap: клієнт не може підробити цифри).
 *
 * Редагування дозволене ЛИШЕ для поточної відкритої зміни — перевіряємо
 * тут-таки на сервері (не лише ховаємо кнопку в UI), бо запит на цей роут
 * можна відправити і в обхід інтерфейсу.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }
  if (session.role !== 'foreman') {
    return NextResponse.json({ error: 'FORBIDDEN_ROLE' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { shiftId, checks } = (body ?? {}) as { shiftId?: unknown; checks?: unknown }
  if (typeof shiftId !== 'number' || !Array.isArray(checks) || checks.length === 0) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const parsedChecks: CheckInput[] = []
  for (const raw of checks) {
    const { taskId, qtyAccepted, comment } = (raw ?? {}) as {
      taskId?: unknown
      qtyAccepted?: unknown
      comment?: unknown
    }
    if (
      typeof taskId !== 'number' ||
      typeof qtyAccepted !== 'number' ||
      !Number.isInteger(qtyAccepted) ||
      qtyAccepted < 0
    ) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }
    parsedChecks.push({ taskId, qtyAccepted, comment: typeof comment === 'string' ? comment.trim() : undefined })
  }

  const currentShift = await getTodayShift()
  if (!currentShift || currentShift.id !== shiftId) {
    return NextResponse.json({ error: 'SHIFT_NOT_CURRENT' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const shift = await payload
    .findByID({ collection: 'shifts', id: shiftId, depth: 1, overrideAccess: true })
    .catch(() => null)
  if (!shift) {
    return NextResponse.json({ error: 'SHIFT_NOT_FOUND' }, { status: 404 })
  }

  // Прохід 1: валідуємо ВСІ рядки, нічого не пишемо. Інакше при помилці на
  // другій-третій задачі перші вже були б збережені — частковий, заплутаний
  // результат для бригадира.
  const prepared: PreparedCheck[] = []
  for (const check of parsedChecks) {
    const task = await payload
      .findByID({ collection: 'tasks', id: check.taskId, overrideAccess: true })
      .catch(() => null)
    if (!task) {
      return NextResponse.json({ error: 'TASK_NOT_FOUND', taskId: check.taskId }, { status: 404 })
    }

    const { docs: progress } = await payload.find({
      collection: 'taskProgress',
      where: { and: [{ shift: { equals: shiftId } }, { task: { equals: check.taskId } }] },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    const qtyDone = progress.reduce((sum, p) => sum + p.qtyDelta, 0)
    if (qtyDone === 0) {
      // Задачу цю зміну взагалі не торкались — нема що перевіряти.
      return NextResponse.json({ error: 'NO_PROGRESS_THIS_SHIFT', taskId: check.taskId }, { status: 409 })
    }
    if (check.qtyAccepted > qtyDone) {
      return NextResponse.json({ error: 'QTY_ACCEPTED_EXCEEDS_DONE', taskId: check.taskId }, { status: 400 })
    }

    const defect = qtyDone - check.qtyAccepted
    if (defect > 0 && !check.comment) {
      return NextResponse.json({ error: 'COMMENT_REQUIRED', taskId: check.taskId }, { status: 400 })
    }

    prepared.push({ check, task, qtyDone, defect })
  }

  // Прохід 2: усе валідне — тепер пишемо.
  let isUpdate = false

  for (const { check, task, qtyDone, defect } of prepared) {
    const existingCheck = await payload
      .find({
        collection: 'qualityChecks',
        where: { and: [{ shift: { equals: shiftId } }, { task: { equals: check.taskId } }] },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      .then((res) => res.docs[0] ?? null)

    if (existingCheck) isUpdate = true

    const checkData = {
      shift: shiftId,
      task: check.taskId,
      qtyDone,
      qtyAccepted: check.qtyAccepted,
      comment: check.comment,
      checkedBy: session.workerId,
    }

    if (existingCheck) {
      await payload.update({
        collection: 'qualityChecks',
        id: existingCheck.id,
        data: checkData,
        overrideAccess: true,
      })
    } else {
      await payload.create({ collection: 'qualityChecks', data: checkData, overrideAccess: true })
    }

    if (defect > 0) {
      // Ідемпотентність без окремого поля-зв'язку: рework-задача цього
      // (зміна, задача)-запису — це відкрита переробка, carried саме з цієї
      // задачі, створена НЕ РАНІШЕ відкриття поточної зміни. Оскільки
      // редагувати можна лише поточну зміну (перевірено вище), тут завжди
      // рівно один кандидат — попередній запуск цього ж роуту для цього ж
      // (зміна, задача), якщо він був.
      const existingRework = await payload
        .find({
          collection: 'tasks',
          where: {
            and: [
              { carriedFromTask: { equals: check.taskId } },
              { taskType: { equals: 'rework' } },
              { completedAt: { exists: false } },
              ...(shift.openedAt ? [{ createdAt: { greater_than_equal: shift.openedAt } }] : []),
            ],
          },
          sort: '-createdAt',
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        .then((res) => res.docs[0] ?? null)

      const reworkData = {
        title: `Переробка: ${task.title} — брак ${defect} шт`,
        description: check.comment,
        taskType: 'rework' as const,
        targetQty: defect,
        carriedFromTask: check.taskId,
        date: new Date().toISOString(),
      }

      if (existingRework) {
        await payload.update({
          collection: 'tasks',
          id: existingRework.id,
          data: reworkData,
          overrideAccess: true,
        })
      } else {
        await payload.create({ collection: 'tasks', data: reworkData, overrideAccess: true })
      }
    }
  }

  after(async () => {
    const { docs: allChecks } = await payload.find({
      collection: 'qualityChecks',
      where: { shift: { equals: shiftId } },
      limit: 1000,
      depth: 1,
      overrideAccess: true,
    })

    await notifyReport({
      kind: 'shift_quality_checked',
      workerName: session.name,
      shiftDateLabel: formatShiftDate(shift.date),
      isUpdate,
      tasks: allChecks.map((check) => ({
        title: typeof check.task === 'object' ? check.task.title : `Задача #${check.task}`,
        qtyDone: check.qtyDone,
        qtyAccepted: check.qtyAccepted,
        comment: check.comment ?? undefined,
      })),
    })
  })

  return NextResponse.json({ ok: true })
}
