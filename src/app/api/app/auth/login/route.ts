import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

import config from '@/payload.config'
import { verifyPin } from '@/utilities/pin'
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/utilities/session'

/**
 * BFF-роут для входу монтажника/бригадира на планшеті: ім'я обирається зі
 * списку (workerId), PIN звіряється тут, на сервері — ніколи на клієнті.
 * Клієнт не отримує pinHash і не бачить, збігся PIN чи ні, доки не прийде
 * ця відповідь.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const { workerId, pin } = (body ?? {}) as { workerId?: unknown; pin?: unknown }

  if (typeof workerId !== 'number' || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  const worker = await payload
    .findByID({
      collection: 'workers',
      id: workerId,
      overrideAccess: true,
      showHiddenFields: true, // потрібен pinHash — інакше не звірити PIN
    })
    .catch(() => null)

  // Одна й та сама відповідь для "нема такого працівника" і "PIN не підходить" —
  // щоб зовнішній запит не міг перевірити, чи існує такий id.
  if (!worker || worker.active === false || !verifyPin(pin, worker.pinHash)) {
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
  }

  const token = createSessionToken({
    workerId: worker.id,
    name: worker.name,
    role: worker.role,
  })

  const res = NextResponse.json({
    worker: { id: worker.id, name: worker.name, role: worker.role },
  })
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}
