import { NextRequest, NextResponse } from 'next/server'

import { getUiStrings } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

/**
 * Клієнтський (client component) фетч uiStrings — на відміну від
 * серверних сторінок, BroadcastGate монтується без пропсів на кожному
 * екрані й тягне власні тексти сам.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionWorker()
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const groupsParam = req.nextUrl.searchParams.get('groups')
  const groups = groupsParam ? groupsParam.split(',') : undefined
  const strings = await getUiStrings(groups)

  return NextResponse.json({ strings })
}
