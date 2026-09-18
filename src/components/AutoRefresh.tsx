'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const REFRESH_INTERVAL_MS = 25_000

/**
 * Тихе автооновлення серверних даних сторінки: планшет тримає екран
 * відкритим годинами, а SSR-рендер (force-dynamic) виконується лише коли
 * щось ЯВНО просить нову навігацію — сам по собі він не оновлюється,
 * поки хтось не перезавантажить застосунок вручну. Звідси баг "нова
 * задача з адмінки не з'являється".
 *
 * router.refresh() перезапускає server-компоненти цього роуту й підмінює
 * дані в уже змонтованому дереві — без повного релоаду, без вбудованого
 * лоадера, без скидання скролу (це поведінка саме refresh(), на відміну
 * від push/replace). Дочірні клієнтські компоненти самі відповідають за
 * те, щоб не втратити локальний/оптимістичний стан при отриманні нових
 * props (див. TaskScreen.tsx, OwnerTaskGridSection.tsx).
 *
 * Рендерить null — рендерити нічого не потрібно.
 */
export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    function start() {
      if (interval) return
      interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)
    }
    function stop() {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
    // Вкладка/застосунок знову активні (розблокували планшет, повернулись
    // з іншого застосунку) — оновити одразу, не чекаючи циклу, і поки
    // неактивні — не гаяти цикли фонового опитування.
    function handleVisible() {
      if (document.visibilityState === 'visible') {
        router.refresh()
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener('focus', handleVisible)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener('focus', handleVisible)
    }
  }, [router])

  return null
}
