import crypto from 'crypto'

// Легка HMAC-сесія для планшета — окрема від Payload-автентифікації
// адмінки (див. src/access/isAdmin.ts і рішення про BFF-шар).
export const SESSION_COOKIE_NAME = 'sirocco_session'
const SESSION_TTL_MS = 16 * 60 * 60 * 1000 // 16 годин — з запасом на найдовшу зміну

export type SessionPayload = {
  workerId: number
  name: string
  role: 'worker' | 'foreman'
  exp: number
}

function getSecret(): string {
  const secret = process.env.APP_SESSION_SECRET
  if (!secret) {
    throw new Error('APP_SESSION_SECRET не задано в env — сесію підписати нічим.')
  }
  return secret
}

function sign(body: string): string {
  return crypto.createHmac('sha256', getSecret()).update(body).digest('base64url')
}

export function createSessionToken(data: Omit<SessionPayload, 'exp'>): string {
  const payload: SessionPayload = { ...data, exp: Date.now() + SESSION_TTL_MS }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expected = sign(body)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000
