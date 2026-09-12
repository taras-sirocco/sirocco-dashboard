import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { readPrivateBlob } from '@/lib/blobStorage'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Авторизований показ фото кроку інструкції для планшета — StepMedia.read
 * закритий до isAdmin (адмінка сама автентифікується власною сесією й
 * читає файл напряму через Payload-роут; планшет свою PIN-сесію в
 * req.user не має, тому тут той самий проксі-паттерн, що й для Media).
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
    .findByID({ collection: 'stepMedia', id: mediaId, overrideAccess: true })
    .catch(() => null)
  if (!doc?.filename) {
    return new NextResponse(null, { status: 404 })
  }

  const result = await readPrivateBlob(`step-media/${doc.filename}`)
  if (!result || result.statusCode !== 200) {
    return new NextResponse(null, { status: 404 })
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  })
}
