import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getTodayShift } from '@/lib/shifts'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/** Завантаження фото з камери (закриття зміни тощо) — тільки авторизована зміна. */
export async function POST(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const shift = await getTodayShift()
  if (!shift) {
    return NextResponse.json({ error: 'NO_ACTIVE_SHIFT' }, { status: 409 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const source = formData?.get('source')
  const buffer = Buffer.from(await file.arrayBuffer())

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  try {
    const doc = await payload.create({
      collection: 'media',
      data: {
        alt: 'Фото з планшета',
        type: 'photo',
        source:
          typeof source === 'string' ? (source as 'closing_checklist' | 'blocker' | 'comment') : 'closing_checklist',
        shift: shift.id,
        takenAt: new Date().toISOString(),
      },
      file: {
        data: buffer,
        mimetype: file.type || 'image/jpeg',
        name: file.name || `photo-${Date.now()}.jpg`,
        size: buffer.length,
      },
      overrideAccess: true,
    })
    return NextResponse.json({ id: doc.id })
  } catch (err) {
    // Найімовірніша причина: Blob-сховище вимкнене (нема BLOB_READ_WRITE_TOKEN),
    // Payload падає назад на локальний диск, якого на Vercel немає для запису.
    console.error('Media upload failed:', err)
    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
  }
}
