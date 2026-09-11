'use client'

import { useEffect, useState } from 'react'

import { useOutboxCount } from '@/offline/useOutboxCount'

import styles from './TopBar.module.css'

type TopBarProps = {
  onlineLabel: string
  offlineLabel: string
  pendingSyncTemplate: string
}

/** Верхня смуга: лого, час+дата, індикатор мережі + бейдж дій, що чекають синку. */
export function TopBar({ onlineLabel, offlineLabel, pendingSyncTemplate }: TopBarProps) {
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(true)
  const pendingCount = useOutboxCount()

  useEffect(() => {
    setNow(new Date())
    const tick = setInterval(() => setNow(new Date()), 10_000)

    const updateOnline = () => setOnline(navigator.onLine)
    updateOnline()
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)

    return () => {
      clearInterval(tick)
      window.removeEventListener('online', updateOnline)
      window.removeEventListener('offline', updateOnline)
    }
  }, [])

  const time = now
    ? new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(now)
    : '--:--'
  const date = now
    ? new Intl.DateTimeFormat('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
    : ''

  return (
    <header className={styles.bar}>
      {/* eslint-disable-next-line @next/next/no-img-element -- статичний файл з /public, next/image тут зайвий */}
      <img className={styles.logo} src="/logo.svg" alt="Sirocco Energy" />
      <div className={styles.meta}>
        <span className={styles.when}>
          <span className={styles.clock}>{time}</span>
          <span className={styles.date}>{date}</span>
        </span>
        <span
          className={`${styles.dot} ${online ? '' : styles.off}`}
          title={online ? onlineLabel : offlineLabel}
        />
        {pendingCount > 0 && (
          <span className={styles.pending} title={pendingSyncTemplate.replace('{n}', String(pendingCount))}>
            {pendingCount}
          </span>
        )}
      </div>
    </header>
  )
}
