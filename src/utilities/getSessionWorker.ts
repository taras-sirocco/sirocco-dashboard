import { cookies } from 'next/headers'

import { SESSION_COOKIE_NAME, verifySessionToken, type SessionPayload } from './session'

/** Читає й перевіряє сесійну cookie планшета. Без Payload — безпечно для будь-якого контексту. */
export async function getSessionWorker(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value)
}
