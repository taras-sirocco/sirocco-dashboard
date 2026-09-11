import { buildRequestInit } from './buildRequest'
import { addToOutbox, countOutbox, getAllFromOutbox, removeFromOutbox } from './db'
import type { QueuedBody } from './types'

let flushing = false
const listeners = new Set<() => void>()

/** Підписка на зміну черги (для бейджа кількості в TopBar). */
export function onOutboxChange(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notify() {
  listeners.forEach((cb) => cb())
}

export async function enqueue(url: string, kind: string, body: QueuedBody): Promise<void> {
  await addToOutbox({ url, kind, body, createdAt: Date.now() })
  notify()
  void flushQueue()
}

/**
 * Проганяє чергу по одному запису в порядку створення. Мережева помилка
 * (fetch кинув виняток) зупиняє прохід одразу — мережі й досі нема, решту
 * записів чіпати не варто, спробуємо на наступному тику. Реальна HTTP-
 * відповідь (навіть не ok) прибирає запис: повторювати те, що сервер уже
 * один раз обробив і відхилив, сенсу нема.
 */
export async function flushQueue(): Promise<void> {
  if (flushing) return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  flushing = true
  try {
    const entries = (await getAllFromOutbox()).sort((a, b) => a.createdAt - b.createdAt)
    for (const entry of entries) {
      let res: Response
      try {
        res = await fetch(entry.url, buildRequestInit(entry.body))
      } catch {
        break
      }
      if (!res.ok) {
        console.error(`Офлайн-синк: ${entry.kind} відповів ${res.status}, запис із черги видалено`)
      }
      await removeFromOutbox(entry.id)
      notify()
    }
  } finally {
    flushing = false
  }
}

export async function getOutboxCount(): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0
  return countOutbox()
}

let started = false
export function startAutoFlush(): void {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('online', () => void flushQueue())
  setInterval(() => void flushQueue(), 15_000)
  void flushQueue()
}
