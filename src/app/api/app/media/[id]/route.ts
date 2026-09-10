import fs from 'fs/promises'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Авторизований показ файлу: Media.read закрито до isAdmin (навмисно —
 * див. блок логіну), тому планшет не може вантажити файли з Payload
 * напряму. Тут перевіряємо сесію, тоді читаємо байти самі.
 *
 * TODO: прив'язка до локального сховища медіа. Це працює, поки Payload
 * зберігає файли на диску (staticDir = слаг колекції, за замовчуванням).
 * Якщо/коли переїдемо на S3/Vercel Blob — цей fs.readFile треба
 * замінити на звернення до того сховища.
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
  if (!doc?.filename) {
    return new NextResponse(null, { status: 404 })
  }

  const staticDir = path.resolve(process.cwd(), 'media')
  // filename береться лише з findByID (ніколи від клієнта), але все одно
  // перевіряємо, що резолв не виходить за межі staticDir — про всяк випадок.
  const filePath = path.resolve(staticDir, doc.filename)
  if (filePath !== staticDir && !filePath.startsWith(staticDir + path.sep)) {
    return new NextResponse(null, { status: 400 })
  }

  const bytes = await fs.readFile(filePath).catch(() => null)
  if (!bytes) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': doc.mimeType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
