import { getPayload } from 'payload'

import config from '@/payload.config'

import type { UiStringsMap } from './uiStringsFormat'

export type { UiStringsMap } from './uiStringsFormat'
export { t } from './uiStringsFormat'

/**
 * Серверний фетч (Local API) — цей файл НЕ можна імпортувати з клієнтського
 * компонента (див. коментар у uiStringsFormat.ts). Клієнтські компоненти
 * імпортують `t`/`UiStringsMap` напряму з uiStringsFormat.
 *
 * ~130 рядків усього — простіше й надійніше відфільтрувати префікс у коді,
 * ніж покладатись на семантику `like` (це substring-пошук, не anchored).
 */
export async function getUiStrings(groups?: string[]): Promise<UiStringsMap> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'uiStrings',
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const filtered = groups
    ? docs.filter((doc) => groups.some((group) => doc.key.startsWith(`${group}.`)))
    : docs

  return Object.fromEntries(filtered.map((doc) => [doc.key, doc.value]))
}
