import { NextResponse } from 'next/server'

import { getSessionWorker } from './getSessionWorker'
import type { SessionPayload } from './session'

type OwnerGateResult =
  | { session: SessionPayload; response: null }
  | { session: null; response: NextResponse }

/**
 * Спільний гейт для owner-write-роутів (/api/app/owner/*): 401, якщо нема
 * сесії; 403, якщо роль не owner. Викликати ПЕРШИМ рядком, ДО будь-якого
 * payload-виклику з overrideAccess — це єдиний рубіж безпеки для цих
 * роутів (Payload-access ігнорується через overrideAccess:true).
 *
 * Спільний helper замість inline-if у кожному роуті — так само, як
 * requireRole для сторінок: менше шансів забути гейт на одному з роутів.
 */
export async function requireOwnerSession(): Promise<OwnerGateResult> {
  const session = await getSessionWorker()
  if (!session) {
    return { session: null, response: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }) }
  }
  if (session.role !== 'owner') {
    return { session: null, response: NextResponse.json({ error: 'FORBIDDEN_ROLE' }, { status: 403 }) }
  }
  return { session, response: null }
}
