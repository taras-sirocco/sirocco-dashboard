import { redirect } from 'next/navigation'

import type { SessionPayload } from './session'

/**
 * Домашній екран кожної ролі — куди відправити сесію, якій не місце на
 * поточній сторінці. Один спільний список замість розкиданих по екранах
 * inline-редиректів — саме тому, що є другий, який пропустив редирект,
 * і роль просто провалювалась у чужий потік (owner у монтажника).
 */
const ROLE_HOME: Record<SessionPayload['role'], string> = {
  worker: '/tasks',
  foreman: '/quality',
  owner: '/owner',
}

/**
 * Серверний рольовий гейт для сторінки App Router. Викликати ОДРАЗУ після
 * перевірки на `!session` (ця функція не перевіряє автентифікацію — лише
 * роль уже автентифікованої сесії).
 *
 * Якщо роль сесії не входить у `allowed` — редіректить на домашній екран
 * ЦІЄЇ ролі (не на фіксовану адресу): це і є фікс головного ризику з
 * розвідки — раніше екрани монтажника перевіряли конкретно
 * `role === 'foreman'`, тож будь-яка ІНША роль (напр. owner) не
 * відфутболювалась і провалювалась у потік монтажника.
 */
export function requireRole(session: SessionPayload, allowed: SessionPayload['role'][]): void {
  if (!allowed.includes(session.role)) {
    redirect(ROLE_HOME[session.role])
  }
}
