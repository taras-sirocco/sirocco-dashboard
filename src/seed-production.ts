/**
 * Production-сідер — ТІЛЬКИ реальний контент застосунку, однаковий скрізь:
 *   - uiStrings (усі тексти інтерфейсу)
 *   - checklistTemplates: opening + closing
 *
 * НІЧОГО з демо-даних (workers/tasks/changesLog з src/seed.ts) — реальних
 * монтажників з PIN, реальні задачі і кроки Тарас створює сам через
 * адмінку. Ідемпотентний — можна запускати повторно (upsert за key/type).
 *
 * Запуск проти конкретної бази — DATABASE_URL передається інлайн:
 *   DATABASE_URL="<production-url>" npx payload run src/seed-production.ts
 */
import { getPayload } from 'payload'

import config from './payload.config'
import { closingItems, openingItems } from './seed-data/checklistTemplates'
import { uiStrings } from './seed-data/uiStrings'
import { upsertChecklistTemplate } from './seed-data/upsertChecklistTemplate'

async function seedProduction() {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  await upsertChecklistTemplate(payload, 'opening', openingItems)
  await upsertChecklistTemplate(payload, 'closing', closingItems)
  console.log('✓ checklistTemplates: opening, closing')

  for (const s of uiStrings) {
    const found = await payload.find({
      collection: 'uiStrings',
      where: { key: { equals: s.key } },
      limit: 1,
      overrideAccess: true,
    })
    if (found.docs[0]) {
      await payload.update({
        collection: 'uiStrings',
        id: found.docs[0].id,
        data: { value: s.value, note: s.note },
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'uiStrings',
        data: { key: s.key, value: s.value, note: s.note },
        overrideAccess: true,
      })
    }
  }
  console.log(`✓ uiStrings: ${uiStrings.length}`)

  console.log('\nГотово. Монтажники/задачі НЕ заливались — створи їх сам через адмінку.')
}

try {
  await seedProduction()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
