import { getPayload } from 'payload'

import config from '@/payload.config'

export type TaskStep = {
  title: string
  keyPoint: string
  why: string
  mediaId: number | null
}

export type TaskWithSteps = {
  id: number
  title: string
  referenceNote: string
  steps: TaskStep[]
}

/** Задача з процедурою (кроки — контент зі своєї колекції, не uiStrings). */
export async function getTaskWithSteps(taskId: number): Promise<TaskWithSteps | null> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const task = await payload.findByID({ collection: 'tasks', id: taskId, overrideAccess: true }).catch(() => null)
  if (!task) return null

  return {
    id: task.id,
    title: task.title,
    referenceNote: task.referenceNote ?? '',
    steps: (task.steps ?? []).map((step) => ({
      title: step.title,
      keyPoint: step.keyPoint ?? '',
      why: step.why ?? '',
      mediaId: typeof step.media === 'object' && step.media ? step.media.id : (step.media ?? null),
    })),
  }
}
