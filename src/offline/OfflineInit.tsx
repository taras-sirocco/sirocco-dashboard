'use client'

import { useEffect } from 'react'

import { startAutoFlush } from './queue'

/** Монтується один раз у кореневому layout — запускає фоновий синк черги. */
export function OfflineInit() {
  useEffect(() => {
    startAutoFlush()
  }, [])
  return null
}
