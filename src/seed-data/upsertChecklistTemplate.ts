import type { getPayload } from 'payload'

import type { ChecklistItemData } from './checklistTemplates'

/** Спільний upsert для dev- і production-сідера — шукає за `type`, не дублює. */
export async function upsertChecklistTemplate(
  payload: Awaited<ReturnType<typeof getPayload>>,
  type: 'opening' | 'closing',
  items: ChecklistItemData[],
) {
  const found = await payload.find({
    collection: 'checklistTemplates',
    where: { type: { equals: type } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs[0]) {
    await payload.update({
      collection: 'checklistTemplates',
      id: found.docs[0].id,
      data: { items },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'checklistTemplates',
      data: { type, items },
      overrideAccess: true,
    })
  }
}
