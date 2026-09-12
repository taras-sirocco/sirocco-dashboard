import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

import { deletePrivateBlob, readPrivateBlob, uploadPrivateBlob } from './blobStorage'

/**
 * Мінімальний адаптер сховища для StepMedia — фото/схеми до кроків
 * інструкції в адмінці. На відміну від Media (планшетні фото — окремий
 * BFF-роут напряму через blobStorage.ts), тут беремо шлях, коли є
 * ЗВИЧАЙНИЙ Payload-аплоад: адмін просто перетягує файл у стандартну
 * форму колекції, без жодних додаткових полів. Payload сам вимагає
 * "справжній" storage adapter для цього — цей файл саме ним і є.
 *
 * Ім'я блоба детерміноване (`step-media/<filename>`, без випадкового
 * суфікса) — Payload і так гарантує унікальність filename на рівні
 * колекції, тож зайве поле для збереження шляху не потрібне: і
 * завантаження, і видалення, і роздача файлу відновлюють той самий шлях
 * з самого лише filename.
 */
const PREFIX = 'step-media'

export const stepMediaAdapter: Adapter = () => ({
  name: 'step-media-private-blob',
  async handleUpload({ file }) {
    await uploadPrivateBlob(`${PREFIX}/${file.filename}`, file.buffer, file.mimeType, {
      addRandomSuffix: false,
    })
  },
  async handleDelete({ filename }) {
    await deletePrivateBlob(`${PREFIX}/${filename}`).catch(() => {
      // Файлу могло вже не бути (наприклад, повторне видалення) — не заважаємо видаленню документа.
    })
  },
  generateURL({ collection, filename }) {
    return `/api/${collection.slug}/file/${filename}`
  },
  async staticHandler(_req, { params }) {
    const result = await readPrivateBlob(`${PREFIX}/${params.filename}`)
    if (!result || result.statusCode !== 200) {
      return new Response(null, { status: 404 })
    }
    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-cache',
      },
    })
  },
})
