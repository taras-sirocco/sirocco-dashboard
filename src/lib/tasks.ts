import { getPayload } from 'payload'

import config from '@/payload.config'

import { todayRange } from './shifts'

export type TaskWithProgress = {
  id: number
  title: string
  targetQty: number
  done: number
}

/** Задачі на сьогодні в черзі (нативний Payload `orderable`) з фактичним прогресом. */
export async function getTodayTasksWithProgress(): Promise<TaskWithProgress[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { start, end } = todayRange()

  const { docs: tasks } = await payload.find({
    collection: 'tasks',
    where: { date: { greater_than_equal: start, less_than: end } },
    sort: '_order',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  if (tasks.length === 0) return []

  const { docs: progress } = await payload.find({
    collection: 'taskProgress',
    where: { task: { in: tasks.map((task) => task.id) } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const doneByTask = new Map<number, number>()
  for (const entry of progress) {
    const taskId = typeof entry.task === 'object' ? entry.task.id : entry.task
    doneByTask.set(taskId, (doneByTask.get(taskId) ?? 0) + entry.qtyDelta)
  }

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    targetQty: task.targetQty,
    done: Math.min(task.targetQty, doneByTask.get(task.id) ?? 0),
  }))
}
