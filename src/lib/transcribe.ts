/**
 * Whisper-транскрипція аудіо — викликається лише тоді, коли запис вже
 * реально дійшов до сервера (тобто разом із синком, як і решта дій, а не
 * онлайн під час запису). Без OPENAI_API_KEY — м'яко нічого не робить:
 * аудіо все одно зберігається, просто без тексту.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimetype: string,
  filename: string,
): Promise<string | undefined> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return undefined

  try {
    const form = new FormData()
    form.append('file', new Blob([buffer], { type: mimetype }), filename)
    form.append('model', 'whisper-1')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!res.ok) {
      console.error('Whisper: транскрипція не вдалась', res.status, await res.text().catch(() => ''))
      return undefined
    }

    const data = (await res.json()) as { text?: string }
    return data.text?.trim() || undefined
  } catch (err) {
    console.error('Whisper: помилка запиту транскрипції', err)
    return undefined
  }
}
