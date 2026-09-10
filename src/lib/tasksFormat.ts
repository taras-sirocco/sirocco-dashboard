/**
 * Чисті функції над задачами — БЕЗ імпорту Payload. Окремо від tasks.ts
 * з тієї ж причини, що uiStringsFormat.ts окремо від uiStrings.ts: клієнтські
 * компоненти імпортують звідси, інакше payload.config тягнеться в бандл.
 */
export type TaskWithProgress = {
  id: number
  title: string
  targetQty: number
  done: number
}

/** Індекс першої незавершеної задачі, -1 якщо всі готові. */
export function getCurrentTaskIndex(tasks: TaskWithProgress[]): number {
  return tasks.findIndex((task) => task.done < task.targetQty)
}
