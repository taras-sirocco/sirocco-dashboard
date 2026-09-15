import { getPayload } from 'payload'

import config from '@/payload.config'

export type { TaskWithProgress } from './tasksFormat'
export { getCurrentTaskIndex } from './tasksFormat'

import type { TaskWithProgress } from './tasksFormat'

/**
 * Усі НЕЗАКРИТІ задачі в черзі (нативний Payload `orderable`), з фактичним
 * прогресом. Закриття — по лічильнику (completedAt проставляється в
 * tasks/progress route, коли done досягає цілі), не по даті: `date`
 * лишається в схемі лише як орієнтир планування, видимість більше не
 * фільтрує. Назва функції історична (было "сьогоднішні") — сенс уже не
 * прив'язаний до календарного дня, як і getTodayShift.
 */
export async function getTodayTasksWithProgress(): Promise<TaskWithProgress[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs: tasks } = await payload.find({
    collection: 'tasks',
    where: { completedAt: { exists: false } },
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
    description: task.description ?? '',
    targetQty: task.targetQty,
    // Перебір показуємо як є (10/9) — задача вже закрита сервером
    // окремим completedAt, тут кліпати число більше нема сенсу.
    done: doneByTask.get(task.id) ?? 0,
  }))
}
