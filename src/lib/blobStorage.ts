import { del, get, put } from '@vercel/blob'

/**
 * Прямий доступ до приватного Vercel Blob — в обхід @payloadcms/storage-vercel-blob,
 * бо той плагін вміє вантажити лише з access:'public' (перевірено в типах пакета),
 * а наше єдине сховище тепер приватне. Media-документи в Payload зберігають лише
 * метадані (blobPathname) — самі байти живуть тільки в Blob.
 */
export async function uploadPrivateBlob(
  pathname: string,
  buffer: Buffer,
  contentType: string,
  options?: { addRandomSuffix?: boolean },
): Promise<{ pathname: string; url: string }> {
  const blob = await put(pathname, buffer, {
    access: 'private',
    contentType,
    addRandomSuffix: options?.addRandomSuffix ?? true,
  })
  return { pathname: blob.pathname, url: blob.url }
}

export async function readPrivateBlob(pathname: string) {
  return get(pathname, { access: 'private' })
}

export async function deletePrivateBlob(pathname: string): Promise<void> {
  await del(pathname)
}
