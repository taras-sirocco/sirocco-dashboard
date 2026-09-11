import type { Payload } from 'payload'

import { transcribeAudio } from './transcribe'

/**
 * Створює Media-документ для голосового запису й одразу пробує
 * транскрибувати (Whisper, якщо налаштований) — один виклик на весь
 * ланцюжок, щоб офлайн-черзі не довелося склеювати кілька запитів.
 *
 * Якщо збереження аудіо впало (сховище недоступне тощо) — не валить весь
 * запит: текст коментаря/проблеми важливіший за аудіо, тож повертає
 * порожній результат і лише логує, як і /api/app/media.
 */
export async function createAudioMedia(
  payload: Payload,
  params: {
    buffer: Buffer
    mimetype: string
    filename: string
    source: 'comment' | 'blocker' | 'closing_checklist'
    shiftId: number
  },
): Promise<{ mediaId?: number; transcript?: string }> {
  try {
    const [doc, transcript] = await Promise.all([
      payload.create({
        collection: 'media',
        data: {
          alt: 'Голосовий запис',
          type: 'audio',
          source: params.source,
          shift: params.shiftId,
          takenAt: new Date().toISOString(),
        },
        file: {
          data: params.buffer,
          mimetype: params.mimetype,
          name: params.filename,
          size: params.buffer.length,
        },
        overrideAccess: true,
      }),
      transcribeAudio(params.buffer, params.mimetype, params.filename),
    ])
    return { mediaId: doc.id, transcript }
  } catch (err) {
    console.error('Збереження аудіо не вдалось:', err)
    return {}
  }
}
