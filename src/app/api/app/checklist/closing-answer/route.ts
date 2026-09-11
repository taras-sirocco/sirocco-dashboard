import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { saveMediaFile } from '@/lib/mediaStorage'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Одна відповідь чек-листа закриття (toggle ok/problem, опційно фото).
 * Run для сьогоднішньої зміни резолвиться/створюється тут-таки — клієнт
 * не знає і не передає runId/shiftId, тільки itemKey.
 *
 * Приймає або JSON { itemKey, status, mediaId }, або multipart з полями
 * itemKey, status і файлом photo — фото завантажується і прив'язується в
 * одному запиті, щоб офлайн-черзі не довелось склеювати завантаження фото
 * (окремий id) з наступним записом відповіді.
 */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  let itemKey: string | null = null
  let status: 'ok' | 'problem' | null = null
  let mediaId: number | undefined
  let photoFile: File | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }
    const rawItemKey = formData.get('itemKey')
    itemKey = typeof rawItemKey === 'string' ? rawItemKey : null
    const rawStatus = formData.get('status')
    status = rawStatus === 'ok' || rawStatus === 'problem' ? rawStatus : null
    const rawPhoto = formData.get('photo')
    if (rawPhoto instanceof File) photoFile = rawPhoto
  } else {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }
    const parsed = (body ?? {}) as { itemKey?: unknown; status?: unknown; mediaId?: unknown }
    itemKey = typeof parsed.itemKey === 'string' ? parsed.itemKey : null
    status = parsed.status === 'ok' || parsed.status === 'problem' ? parsed.status : null
    mediaId = typeof parsed.mediaId === 'number' ? parsed.mediaId : undefined
  }

  if (!itemKey || !status) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  if (photoFile) {
    const buffer = Buffer.from(await photoFile.arrayBuffer())
    const mimetype = photoFile.type || 'image/jpeg'
    try {
      const saved = await saveMediaFile(
        `closing-checklist/${shift.id}`,
        buffer,
        mimetype,
        photoFile.name || `photo-${Date.now()}.jpg`,
      )
      const photoDoc = await payload.create({
        collection: 'media',
        data: {
          alt: 'Фото з планшета',
          type: 'photo',
          source: 'closing_checklist',
          shift: shift.id,
          takenAt: new Date().toISOString(),
          blobPathname: saved.blobPathname,
          filename: saved.filename,
          mimeType: saved.mimeType,
        },
        overrideAccess: true,
      })
      mediaId = photoDoc.id
    } catch (err) {
      console.error('Closing checklist photo upload failed:', err)
      return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
    }
  }

  const template = await payload
    .find({
      collection: 'checklistTemplates',
      where: { type: { equals: 'closing' } },
      limit: 1,
      overrideAccess: true,
    })
    .then((res) => res.docs[0] ?? null)
  if (!template) {
    return NextResponse.json({ error: 'NO_TEMPLATE' }, { status: 500 })
  }

  const existingRuns = await payload.find({
    collection: 'checklistRuns',
    where: { and: [{ shift: { equals: shift.id } }, { template: { equals: template.id } }] },
    limit: 1,
    overrideAccess: true,
  })
  const run =
    existingRuns.docs[0] ??
    (await payload.create({
      collection: 'checklistRuns',
      data: { shift: shift.id, template: template.id, templateVersion: template.version ?? 1 },
      overrideAccess: true,
    }))

  const existingAnswers = await payload.find({
    collection: 'checklistAnswers',
    where: { and: [{ run: { equals: run.id } }, { itemKey: { equals: itemKey } }] },
    limit: 1,
    overrideAccess: true,
  })

  const data: { status: 'ok' | 'problem'; photo?: number; answeredAt: string } = {
    status,
    photo: mediaId,
    answeredAt: new Date().toISOString(),
  }

  if (existingAnswers.docs[0]) {
    await payload.update({
      collection: 'checklistAnswers',
      id: existingAnswers.docs[0].id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'checklistAnswers',
      data: { run: run.id, itemKey, ...data },
      overrideAccess: true,
    })
  }

  return NextResponse.json({ ok: true, mediaId })
}
