import fs from 'fs/promises'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Авторизований показ файлу: Media.read закрито до isAdmin (навмисно —
 * див. блок логіну), тому планшет не може вантажити файли з Payload
 * напряму. Тут перевіряємо сесію, тоді читаємо байти самі — з диска
 * локально, або з Vercel Blob на проді (doc.url — абсолютний http(s),
 * коли активне хмарне сховище; відносний шлях — коли файл лежить
 * локально). Клієнт ніколи не бачить сам blob-URL, лише цей роут —
 * ні в <img>, ні в JSON-відповідях, ні в логах (перевірено вручну).
 *
 * TODO: Vercel Blob поки підтримує лише access:'public' (без приватних/
 * підписаних URL). Коли Vercel це випустить — перейти на приватний режим,
 * щоб не покладатись на невгадуваність URL як єдиний захист сховища.
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

  const contentType = doc.mimeType ?? 'application/octet-stream'

  // Хмарне сховище активне (doc.url — абсолютний http(s) з Vercel Blob).
  if (doc.url && /^https?:\/\//.test(doc.url)) {
    const upstream = await fetch(doc.url).catch(() => null)
    if (!upstream?.ok || !upstream.body) {
      return new NextResponse(null, { status: 404 })
    }
    return new NextResponse(upstream.body, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
    })
  }

  // Локальне сховище (dev): читаємо з диска. filename береться лише з
  // findByID (ніколи від клієнта), але все одно перевіряємо, що резолв
  // не виходить за межі staticDir — про всяк випадок.
  const staticDir = path.resolve(process.cwd(), 'media')
  const filePath = path.resolve(staticDir, doc.filename)
  if (filePath !== staticDir && !filePath.startsWith(staticDir + path.sep)) {
    return new NextResponse(null, { status: 400 })
  }

  const bytes = await fs.readFile(filePath).catch(() => null)
  if (!bytes) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
  })
}
