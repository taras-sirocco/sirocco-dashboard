import { getPayload } from 'payload'

import config from '@/payload.config'

export type ChecklistItem = {
  key: string
  text: string
  requiresPhoto: boolean
}

export type ChecklistTemplateData = {
  id: number
  version: number
  items: ChecklistItem[]
}

/** Останній (єдиний) шаблон чек-листа заданого типу. Контентні тексти — зі своєї колекції, не з uiStrings. */
export async function getChecklistTemplate(
  type: 'opening' | 'closing',
): Promise<ChecklistTemplateData | null> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'checklistTemplates',
    where: { type: { equals: type } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const doc = docs[0]
  if (!doc) return null

  return {
    id: doc.id,
    version: doc.version ?? 1,
    items: (doc.items ?? []).map((item) => ({
      key: item.key,
      text: item.text,
      requiresPhoto: Boolean(item.requiresPhoto),
    })),
  }
}
