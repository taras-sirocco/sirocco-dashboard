import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift } from './shifts'

export type ShiftQualitySummary = {
  shiftId: number
  date: string
  responsibleName: string
  isOpen: boolean
  isCurrent: boolean
  taskCount: number
  checkedCount: number
  hasDefect: boolean
  needsCheck: boolean
}

export type QualityTaskRow = {
  taskId: number
  title: string
  taskType: 'production' | 'rework'
  qtyDone: number
  qtyAccepted: number | null
  comment: string
}

export type ShiftQualityDetail = {
  shiftId: number
  date: string
  responsibleName: string
  isEditable: boolean
  rows: QualityTaskRow[]
}

function workerName(worker: unknown): string {
  if (worker && typeof worker === 'object' && 'name' in worker) {
    return String((worker as { name: unknown }).name ?? '—')
  }
  return '—'
}

/**
 * Список змін для екрана бригадира — найновіші перші. Показує лише зміни,
 * яких хтось торкнувся (є хоч один запис прогресу), інакше список
 * захаращений порожніми записами без жодної задачі для перевірки.
 * Поточна відкрита зміна показується завжди, навіть без прогресу, — щоб
 * бригадир бачив, що зараз відбувається.
 */
export async function getQualityCheckList(): Promise<ShiftQualitySummary[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const currentShift = await getTodayShift()

  // -createdAt, не -date: кілька циклів зміни за один день мають однакове
  // date, тому лише порядок створення справді сортує "найновіші перші".
  const { docs: shifts } = await payload.find({
    collection: 'shifts',
    sort: '-createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  const { docs: progress } = await payload.find({
    collection: 'taskProgress',
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const tasksByShift = new Map<number, Set<number>>()
  for (const entry of progress) {
    const shiftId = typeof entry.shift === 'object' ? entry.shift.id : entry.shift
    const taskId = typeof entry.task === 'object' ? entry.task.id : entry.task
    if (!tasksByShift.has(shiftId)) tasksByShift.set(shiftId, new Set())
    tasksByShift.get(shiftId)!.add(taskId)
  }

  const { docs: checks } = await payload.find({
    collection: 'qualityChecks',
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const checksByShift = new Map<number, { count: number; hasDefect: boolean }>()
  for (const check of checks) {
    const shiftId = typeof check.shift === 'object' ? check.shift.id : check.shift
    const entry = checksByShift.get(shiftId) ?? { count: 0, hasDefect: false }
    entry.count += 1
    if (check.qtyAccepted < check.qtyDone) entry.hasDefect = true
    checksByShift.set(shiftId, entry)
  }

  return shifts
    .filter((shift) => (tasksByShift.get(shift.id)?.size ?? 0) > 0 || shift.id === currentShift?.id)
    .map((shift) => {
      const taskCount = tasksByShift.get(shift.id)?.size ?? 0
      const checkInfo = checksByShift.get(shift.id) ?? { count: 0, hasDefect: false }
      const isCurrent = shift.id === currentShift?.id
      return {
        shiftId: shift.id,
        date: shift.date,
        responsibleName: workerName(shift.responsibleUser),
        isOpen: Boolean(shift.openedAt) && !shift.closedAt,
        isCurrent,
        taskCount,
        checkedCount: checkInfo.count,
        hasDefect: checkInfo.hasDefect,
        needsCheck: isCurrent && checkInfo.count < taskCount,
      }
    })
}

/**
 * Задачі й фактичний прогрес КОНКРЕТНОЇ зміни (не по дню, не накопичено за
 * весь час задачі — лише те, що зробили саме в цю зміну, через
 * taskProgress.shift). Разом з уже збереженою перевіркою, якщо була.
 */
export async function getShiftQualityDetail(shiftId: number): Promise<ShiftQualityDetail | null> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const shift = await payload
    .findByID({ collection: 'shifts', id: shiftId, depth: 1, overrideAccess: true })
    .catch(() => null)
  if (!shift) return null

  const currentShift = await getTodayShift()

  const { docs: progress } = await payload.find({
    collection: 'taskProgress',
    where: { shift: { equals: shiftId } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })

  const doneByTask = new Map<number, number>()
  const firstSeenByTask = new Map<number, string>()
  for (const entry of progress) {
    const taskId = typeof entry.task === 'object' ? entry.task.id : entry.task
    doneByTask.set(taskId, (doneByTask.get(taskId) ?? 0) + entry.qtyDelta)
    const createdAt = entry.createdAt
    if (!firstSeenByTask.has(taskId) || createdAt < firstSeenByTask.get(taskId)!) {
      firstSeenByTask.set(taskId, createdAt)
    }
  }

  const taskIds = [...doneByTask.keys()]
  if (taskIds.length === 0) {
    return {
      shiftId: shift.id,
      date: shift.date,
      responsibleName: workerName(shift.responsibleUser),
      isEditable: shift.id === currentShift?.id,
      rows: [],
    }
  }

  const { docs: tasks } = await payload.find({
    collection: 'tasks',
    where: { id: { in: taskIds } },
    limit: taskIds.length,
    depth: 0,
    overrideAccess: true,
  })
  const taskById = new Map(tasks.map((task) => [task.id, task]))

  const { docs: existingChecks } = await payload.find({
    collection: 'qualityChecks',
    where: { shift: { equals: shiftId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })
  const checkByTask = new Map(
    existingChecks.map((check) => [typeof check.task === 'object' ? check.task.id : check.task, check]),
  )

  const rows: QualityTaskRow[] = taskIds
    .sort((a, b) => (firstSeenByTask.get(a) ?? '').localeCompare(firstSeenByTask.get(b) ?? ''))
    .map((taskId) => {
      const task = taskById.get(taskId)
      const existing = checkByTask.get(taskId)
      return {
        taskId,
        title: task?.title ?? `Задача #${taskId}`,
        taskType: (task?.taskType as 'production' | 'rework') ?? 'production',
        qtyDone: doneByTask.get(taskId) ?? 0,
        qtyAccepted: existing ? existing.qtyAccepted : null,
        comment: existing?.comment ?? '',
      }
    })

  return {
    shiftId: shift.id,
    date: shift.date,
    responsibleName: workerName(shift.responsibleUser),
    isEditable: shift.id === currentShift?.id,
    rows,
  }
}
