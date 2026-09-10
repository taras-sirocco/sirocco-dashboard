import crypto from 'crypto'

// Той самий підхід (pbkdf2, солений хеш), що Payload сам використовує для
// пароля адмінки (див. payload/dist/auth/strategies/local/generatePasswordSaltHash.js) —
// без додаткової залежності на bcrypt.
const ITERATIONS = 25000
const KEYLEN = 64
const DIGEST = 'sha256'

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(pin, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPin(pin: string, pinHash: string | null | undefined): boolean {
  if (!pinHash) return false
  const [salt, hash] = pinHash.split(':')
  if (!salt || !hash) return false
  const check = crypto.pbkdf2Sync(pin, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(check, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
