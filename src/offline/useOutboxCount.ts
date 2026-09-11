'use client'

import { useEffect, useState } from 'react'

import { getOutboxCount, onOutboxChange } from './queue'

/** Скільки дій ще чекають синхронізації — для бейджа в TopBar. */
export function useOutboxCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      void getOutboxCount().then((n) => {
        if (!cancelled) setCount(n)
      })
    }
    refresh()
    const unsubscribe = onOutboxChange(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return count
}
