import { getPayload } from 'payload'

import config from '@/payload.config'

export type OwnerTaskCard = {
  id: number
  title: string
  description: string
  taskType: 'production' | 'rework'
  targetQty: number
  qtyDone: number
  isCompleted: boolean
  hasProgress: boolean
  isQualityChecked: boolean
}

/**
 * Задачі для сітки власника — самоочисний фільтр, без ручного
 * приховування: показуємо, якщо `completedAt IS NULL` (ще відкрита) АБО
 * `targetQty > qtyDone` (закрита, але власник підняв ціль вище зробленого
 * — той самий момент, коли PATCH-роут /api/app/owner/tasks/[id] чистить
 * completedAt і вона знову з'являється й монтажнику). Щойно закрита
 * задача, де target ще не піднімали, зникає із сітки сама.
 *
 * Це рахується в JS, не в where — completedAt і targetQty>qtyDone разом
 * не звести в один Payload-запит (qtyDone — агрегат з іншої колекції).
 *
 * qtyDone — накопичено за ввесь час (не за зміну): targetQty теж
 * довічна ціль задачі, а не денна, тож порівнювати треба з тим самим.
 */
export async function getOwnerActiveTasks(): Promise<OwnerTaskCard[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: allTasks } = await payload.find({
    collection: 'tasks',
    sort: '_order',
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  if (allTasks.length === 0) return []

  const allTaskIds = allTasks.map((task) => task.id)
  const { docs: progress } = await payload.find({
    collection: 'taskProgress',
    where: { task: { in: allTaskIds } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })
  const doneByTask = new Map<number, number>()
  for (const entry of progress) {
    const taskId = typeof entry.task === 'object' ? entry.task.id : entry.task
    doneByTask.set(taskId, (doneByTask.get(taskId) ?? 0) + entry.qtyDelta)
  }

  const visibleTasks = allTasks.filter((task) => {
    if (!task.completedAt) return true
    return task.targetQty > (doneByTask.get(task.id) ?? 0)
  })
  if (visibleTasks.length === 0) return []

  const visibleTaskIds = visibleTasks.map((task) => task.id)
  const { docs: checks } = await payload.find({
    collection: 'qualityChecks',
    where: { task: { in: visibleTaskIds } },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  })
  const checkedTaskIds = new Set<number>()
  for (const check of checks) {
    const taskId = typeof check.task === 'object' ? check.task.id : check.task
    checkedTaskIds.add(taskId)
  }

  return visibleTasks.map((task) => {
    const qtyDone = doneByTask.get(task.id) ?? 0
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      taskType: (task.taskType as 'production' | 'rework') ?? 'production',
      targetQty: task.targetQty,
      qtyDone,
      isCompleted: Boolean(task.completedAt),
      hasProgress: qtyDone > 0,
      isQualityChecked: checkedTaskIds.has(task.id),
    }
  })
}
