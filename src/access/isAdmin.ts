import type { Access } from 'payload'

/**
 * Планшетний застосунок ніколи не ходить у Payload REST/GraphQL напряму —
 * він проходить через власний шар /api/app/* (Local API, overrideAccess).
 * Тому всі внутрішні колекції відкриті лише для увійшовшого в Payload-адмінку
 * (req.user), а не для публічних запитів.
 */
export const isAdmin: Access = ({ req }) => Boolean(req.user)
