import { buildRequestInit } from './buildRequest'
import { enqueue } from './queue'
import type { QueuedBody } from './types'

export type SubmitResult =
  | { ok: true; queued: false; data: unknown }
  | { ok: true; queued: true }
  | { ok: false; queued: false; status: number }

/**
 * Один шлях для "звичайного" запиту й запиту, що піде в чергу. Queued
 * трапляється, лише коли fetch кинув виняток (немає мережі) — реальна
 * відповідь сервера (навіть помилкова) НЕ ставиться в чергу: повтор того
 * самого запиту не виправить помилку валідації чи конфлікт стану.
 */
async function trySubmit(url: string, kind: string, body: QueuedBody): Promise<SubmitResult> {
  try {
    const res = await fetch(url, buildRequestInit(body))
    if (!res.ok) return { ok: false, queued: false, status: res.status }
    const data = await res.json().catch(() => null)
    return { ok: true, queued: false, data }
  } catch {
    await enqueue(url, kind, body)
    return { ok: true, queued: true }
  }
}

export function submitJson(url: string, kind: string, json: unknown): Promise<SubmitResult> {
  return trySubmit(url, kind, { format: 'json', json })
}

export function submitForm(
  url: string,
  kind: string,
  fields: Record<string, string>,
  file?: { blob: Blob; fieldName: string; fileName: string },
): Promise<SubmitResult> {
  return trySubmit(url, kind, { format: 'form', fields, file })
}
