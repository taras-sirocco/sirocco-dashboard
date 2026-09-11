import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { createAudioMedia } from '@/lib/audioMedia'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * «Нотатка до процесу» — нейтральний запис, потрапляє в аркуш дня.
 * Приймає або JSON { text }, або multipart з полями text (опційно) +
 * audio (файл) — голос і текст іде одним запитом, щоб офлайн-черзі не
 * довелось склеювати завантаження аудіо й створення коментаря окремо.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  let text = ''
  let audioFile: File | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }
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
    const { text: rawText } = (body ?? {}) as { text?: unknown }
    if (typeof rawText === 'string') text = rawText
  }

  if (!text.trim() && !audioFile) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
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
      source: 'comment',
      shiftId: shift.id,
    })
    mediaId = result.mediaId
    transcript = result.transcript
  }

  await payload.create({
    collection: 'comments',
    data: {
      shift: shift.id,
      worker: session.workerId,
      text: text.trim() || undefined,
      transcript,
      media: mediaId ? [mediaId] : undefined,
      contextType: 'general',
    },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}
