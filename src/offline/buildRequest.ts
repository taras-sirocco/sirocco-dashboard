import type { QueuedBody } from './types'

/** Той самий формат запиту і для першої спроби, і для повтору з черги — щоб поведінка не розходилась. */
export function buildRequestInit(body: QueuedBody): RequestInit {
  if (body.format === 'json') {
    return {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.json),
    }
  }
  const form = new FormData()
  for (const [key, value] of Object.entries(body.fields)) form.append(key, value)
  if (body.file) form.append(body.file.fieldName, body.file.blob, body.file.fileName)
  return { method: 'POST', body: form }
}
