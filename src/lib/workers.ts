import { getPayload } from 'payload'

import config from '@/payload.config'

export type LoginWorker = {
  id: number
  name: string
  role: 'worker' | 'foreman'
}

/** Список для плиток на екрані входу. Ніколи не включає pinHash. */
export async function getActiveWorkers(): Promise<LoginWorker[]> {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const { docs } = await payload.find({
    collection: 'workers',
    where: { active: { not_equals: false } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
    select: { name: true, role: true },
  })

  return docs.map((doc) => ({ id: doc.id, name: doc.name, role: doc.role }))
}
