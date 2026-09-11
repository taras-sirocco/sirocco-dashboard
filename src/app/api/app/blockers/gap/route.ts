import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { createAudioMedia } from '@/lib/audioMedia'
import { getTodayShift, todayRange } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * «Що завадило?» для задачі з недобором. Записує причину (blockers,
 * kind: gap) і автоматично переносить залишок на завтра — нову задачу
 * з targetQty = залишок, carriedFromTask = ця задача. done/target
 * беремо із сервера (getTodayTasksWithProgress), не з тіла запиту —
 * клієнт не може підробити цифри недобору. Приймає JSON або multipart
 * (taskId, text, audio) — як /api/app/comments.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  let taskId: number | null = null
  let text = ''
  let audioFile: File | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }
    const rawTaskId = formData.get('taskId')
    taskId = typeof rawTaskId === 'string' && rawTaskId.trim() ? Number(rawTaskId) : null
    const rawText = formData.get('text')
    if (typeof rawText === 'string') text = rawText
    const rawAudio = formData.get('audio')
    if (rawAudio instanceof File) audioFile = rawAudio
  } else {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }
    const { taskId: rawTaskId, text: rawText } = (body ?? {}) as { taskId?: unknown; text?: unknown }
    taskId = typeof rawTaskId === 'number' ? rawTaskId : null
    if (typeof rawText === 'string') text = rawText
  }

  if (taskId === null || !Number.isInteger(taskId)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const tasks = await getTodayTasksWithProgress()
  const task = tasks.find((t) => t.id === taskId)
  if (!task) {
    return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
  }

  const remaining = task.targetQty - task.done
  if (remaining <= 0) {
    return NextResponse.json({ error: 'NO_GAP' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  let mediaId: number | undefined
  let transcript: string | undefined
  if (audioFile) {
    const buffer = Buffer.from(await audioFile.arrayBuffer())
    const result = await createAudioMedia(payload, {
      buffer,
      mimetype: audioFile.type || 'audio/webm',
      filename: audioFile.name || `voice-${Date.now()}.webm`,
      source: 'blocker',
      shiftId: shift.id,
    })
    mediaId = result.mediaId
    transcript = result.transcript
  }

  await payload.create({
    collection: 'blockers',
    data: {
      kind: 'gap',
      task: taskId,
      shift: shift.id,
      worker: session.workerId,
      text: text.trim() || undefined,
      transcript,
      media: mediaId ? [mediaId] : undefined,
      qtyDone: task.done,
      targetQty: task.targetQty,
    },
    overrideAccess: true,
  })

  const { end: tomorrowStart } = todayRange()

  await payload.create({
    collection: 'tasks',
    data: {
      title: task.title,
      targetQty: remaining,
      date: tomorrowStart,
      carriedFromTask: taskId,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true, carriedOver: remaining })
}
