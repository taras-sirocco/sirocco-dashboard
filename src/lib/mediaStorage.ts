import fs from 'fs/promises'
import path from 'path'

import { readPrivateBlob, uploadPrivateBlob } from './blobStorage'

const LOCAL_DIR = path.resolve(process.cwd(), 'media')

export type SavedMediaFile = { blobPathname?: string; filename?: string; mimeType: string }

/**
 * На Vercel — приватний Vercel Blob. Локальна розробка (нема Vercel,
 * нема сховища) — диск, як і раніше. Перевіряємо саме process.env.VERCEL
 * (стандартний прапорець рантайму Vercel), а не наявність конкретної
 * змінної токена: @vercel/blob сам розбирається, авторизуватись через
 * BLOB_READ_WRITE_TOKEN чи через OIDC — не наша справа тут вгадувати,
 * яким саме способом. Якщо сховище на проді не налаштоване як слід,
 * put()/get() кинуть реальну помилку — і ми її побачимо (route її ловить
 * і повертає UPLOAD_FAILED), а не мовчки провалимось у запис на диск,
 * якого на Vercel немає для запису.
 */
export async function saveMediaFile(
  pathnamePrefix: string,
  buffer: Buffer,
  mimeType: string,
  fallbackFilename: string,
): Promise<SavedMediaFile> {
  if (process.env.VERCEL) {
    const { pathname } = await uploadPrivateBlob(`${pathnamePrefix}/${fallbackFilename}`, buffer, mimeType)
    return { blobPathname: pathname, mimeType }
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true })
  const filename = `${Date.now()}-${fallbackFilename}`
  await fs.writeFile(path.join(LOCAL_DIR, filename), buffer)
  return { filename, mimeType }
}

export async function readMediaFile(doc: {
  blobPathname?: null | string
  filename?: null | string
  mimeType?: null | string
}): Promise<{ contentType: string; stream: ReadableStream<Uint8Array> | Uint8Array } | null> {
  if (doc.blobPathname) {
    const result = await readPrivateBlob(doc.blobPathname)
    if (!result || result.statusCode !== 200) return null
    return { stream: result.stream, contentType: result.blob.contentType }
  }

  if (doc.filename) {
    const filePath = path.resolve(LOCAL_DIR, doc.filename)
    if (filePath !== LOCAL_DIR && !filePath.startsWith(LOCAL_DIR + path.sep)) return null
    const bytes = await fs.readFile(filePath).catch(() => null)
    if (!bytes) return null
    return { stream: new Uint8Array(bytes), contentType: doc.mimeType ?? 'application/octet-stream' }
  }

  return null
}
