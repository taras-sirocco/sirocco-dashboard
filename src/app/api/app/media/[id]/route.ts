import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { readMediaFile } from '@/lib/mediaStorage'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Авторизований показ файлу: Media.read закрито до isAdmin (навмисно —
 * див. блок логіну), тому планшет не може вантажити файли з Payload
 * напряму. Тут перевіряємо сесію, тоді читаємо байти самі — з приватного
 * Vercel Blob (get(), доступний лише серверним кодом із токеном) на проді,
 * або з диска локально (readMediaFile сам обирає, за doc.blobPathname).
 * Клієнт ніколи не бачить сам blob-URL чи токен, лише цей роут — ні в
 * <img>, ні в JSON-відповідях, ні в логах.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionWorker()
  if (!session) {
    return new NextResponse(null, { status: 401 })
  }

  const { id } = await params
  const mediaId = Number(id)
  if (!Number.isInteger(mediaId)) {
    return new NextResponse(null, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const doc = await payload
    .findByID({ collection: 'media', id: mediaId, overrideAccess: true })
    .catch(() => null)
  if (!doc) {
    return new NextResponse(null, { status: 404 })
  }

  const file = await readMediaFile({
    blobPathname: doc.blobPathname,
    filename: doc.filename,
    mimeType: doc.mimeType,
  })
  if (!file) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(file.stream, {
    headers: {
      'Content-Type': file.contentType,
      'X-Content-Type-Options': 'nosniff',
      // Приватний блоб — не кешувати на CDN/спільних проксі, лише в браузері з ревалідацією щоразу.
      'Cache-Control': 'private, no-cache',
    },
  })
}
