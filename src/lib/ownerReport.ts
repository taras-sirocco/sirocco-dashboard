import { getPayload } from 'payload'

import config from '@/payload.config'
import { getShiftComments, type CommentEntry } from './comments'
import { getShiftChecklist, type ShiftChecklistResult } from './shiftChecklist'

export type QualityStatus = 'checked' | 'not_checked' | 'no_tasks'

export type OwnerShiftListItem = {
  shiftId: number
  date: string
  responsibleName: string
  openedAt: string | null
  closedAt: string | null
  autoClosed: boolean
  qualityStatus: QualityStatus
}

export type OwnerTaskRow = {
  taskId: number
  title: string
  taskType: 'production' | 'rework'
  targetQty: number
  qtyDoneThisShift: number
}

export type OwnerGapReason = {
  taskTitle: string
  text: string
}

export type OwnerQualityCheckRow = {
  taskTitle: string
  qtyDone: number
  qtyAccepted: number
  comment: string
  checkedByName: string
}

export type OwnerPhoto = {
  id: number
  alt: string
}

export type OwnerShiftDetail = {
  shiftId: number
  date: string
  responsibleName: string
  openedAt: string | null
  closedAt: string | null
  autoClosed: boolean
  handoverOk: boolean | null
  handoverNote: string
  tasks: OwnerTaskRow[]
  gapReasons: OwnerGapReason[]
  comments: CommentEntry[]
  openingChecklist: ShiftChecklistResult
  closingChecklist: ShiftChecklistResult
  qualityChecks: OwnerQualityCheckRow[]
  qualityStatus: QualityStatus
  photos: OwnerPhoto[]
}

function workerName(worker: unknown): string {
  if (worker && typeof worker === 'object' && 'name' in worker) {
    return String((worker as { name: unknown }).name ?? '—')
  }
  return '—'
}

/**
 * Список УСІХ змін для звіту власника, найновіші перші — на відміну від
 * getQualityCheckList (lib/qualityChecks.ts), який показує лише зміни з
 * прогресом (+ поточну). Тут навмисно без цього фільтра: власнику потрібна
 * повна історія, включно з порожніми циклами відкриття-закриття.
 *
 * Критерій qualityStatus — той самий, що в getQualityCheckList:
 * checkedCount === taskCount (не проста наявність рядка qualityChecks).
 * "no_tasks" — окремий стан для змін без жодного прогресу, щоб порожня
 * зміна не показувалась зеленим "перевірено" (0===0 технічно так, але
 * перевіряти там нічого).
 */
export async function getOwnerShiftList(): Promise<OwnerShiftListItem[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: shifts } = await payload.find({
    collection: 'shifts',
    sort: '-createdAt',
    limit: 200,
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
  const checkedCountByShift = new Map<number, number>()
  for (const check of checks) {
    const shiftId = typeof check.shift === 'object' ? check.shift.id : check.shift
    checkedCountByShift.set(shiftId, (checkedCountByShift.get(shiftId) ?? 0) + 1)
  }

  return shifts.map((shift) => {
    const taskCount = tasksByShift.get(shift.id)?.size ?? 0
    const checkedCount = checkedCountByShift.get(shift.id) ?? 0
    const qualityStatus: QualityStatus =
      taskCount === 0 ? 'no_tasks' : checkedCount === taskCount ? 'checked' : 'not_checked'

    return {
      shiftId: shift.id,
      date: shift.date,
      responsibleName: workerName(shift.responsibleUser),
      openedAt: shift.openedAt ?? null,
      closedAt: shift.closedAt ?? null,
      autoClosed: Boolean(shift.autoClosed),
      qualityStatus,
    }
  })
}

/**
 * Зведений звіт КОНКРЕТНОЇ зміни — увесь слід зміни в одному місці.
 * Прогрес по задачах рахується САМЕ за цю зміну (taskProgress.shift=X),
 * не накопичено за весь час задачі — той самий принцип, що в
 * getShiftQualityDetail (lib/qualityChecks.ts).
 */
export async function getOwnerShiftDetail(shiftId: number): Promise<OwnerShiftDetail | null> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const shift = await payload
    .findByID({ collection: 'shifts', id: shiftId, depth: 1, overrideAccess: true })
    .catch(() => null)
  if (!shift) return null

  const [
    { docs: progress },
    { docs: gapBlockers },
    { docs: qualityCheckDocs },
    { docs: photoDocs },
    comments,
    openingChecklist,
    closingChecklist,
  ] = await Promise.all([
    payload.find({
      collection: 'taskProgress',
      where: { shift: { equals: shiftId } },
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'blockers',
      where: { and: [{ kind: { equals: 'gap' } }, { shift: { equals: shiftId } }] },
      limit: 100,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'qualityChecks',
      where: { shift: { equals: shiftId } },
      limit: 1000,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'media',
      where: { and: [{ shift: { equals: shiftId } }, { source: { equals: 'closing_checklist' } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    }),
    getShiftComments(shiftId),
    getShiftChecklist(shiftId, 'opening'),
    getShiftChecklist(shiftId, 'closing'),
  ])

  // Прогрес САМЕ цієї зміни, згруповано по задачі.
  const doneByTask = new Map<number, number>()
  for (const entry of progress) {
    const taskId = typeof entry.task === 'object' ? entry.task.id : entry.task
    doneByTask.set(taskId, (doneByTask.get(taskId) ?? 0) + entry.qtyDelta)
  }
  const taskIds = [...doneByTask.keys()]

  const taskById = new Map<number, { title: string; taskType: 'production' | 'rework'; targetQty: number }>()
  if (taskIds.length > 0) {
    const { docs: tasks } = await payload.find({
      collection: 'tasks',
      where: { id: { in: taskIds } },
      limit: taskIds.length,
      depth: 0,
      overrideAccess: true,
    })
    for (const task of tasks) {
      taskById.set(task.id, {
        title: task.title,
        taskType: (task.taskType as 'production' | 'rework') ?? 'production',
        targetQty: task.targetQty,
      })
    }
  }

  const tasks: OwnerTaskRow[] = taskIds.map((taskId) => {
    const task = taskById.get(taskId)
    return {
      taskId,
      title: task?.title ?? `Задача #${taskId}`,
      taskType: task?.taskType ?? 'production',
      targetQty: task?.targetQty ?? 0,
      qtyDoneThisShift: doneByTask.get(taskId) ?? 0,
    }
  })

  const gapReasons: OwnerGapReason[] = gapBlockers
    .filter((blocker) => Boolean(blocker.text))
    .map((blocker) => ({
      taskTitle: typeof blocker.task === 'object' && blocker.task ? blocker.task.title : '—',
      text: blocker.text ?? '',
    }))

  const qualityChecks: OwnerQualityCheckRow[] = qualityCheckDocs.map((check) => ({
    taskTitle: typeof check.task === 'object' && check.task ? check.task.title : `Задача #${check.task}`,
    qtyDone: check.qtyDone,
    qtyAccepted: check.qtyAccepted,
    comment: check.comment ?? '',
    checkedByName: workerName(check.checkedBy),
  }))

  const taskCount = taskIds.length
  const checkedCount = qualityCheckDocs.length
  const qualityStatus: QualityStatus =
    taskCount === 0 ? 'no_tasks' : checkedCount === taskCount ? 'checked' : 'not_checked'

  const photos: OwnerPhoto[] = photoDocs.map((doc) => ({ id: doc.id, alt: doc.alt ?? '' }))

  return {
    shiftId: shift.id,
    date: shift.date,
    responsibleName: workerName(shift.responsibleUser),
    openedAt: shift.openedAt ?? null,
    closedAt: shift.closedAt ?? null,
    autoClosed: Boolean(shift.autoClosed),
    handoverOk: shift.handoverOk ?? null,
    handoverNote: shift.handoverNote ?? '',
    tasks,
    gapReasons,
    comments,
    openingChecklist,
    closingChecklist,
    qualityChecks,
    qualityStatus,
    photos,
  }
}
