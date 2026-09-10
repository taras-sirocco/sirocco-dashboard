'use client'

import { useRouter } from 'next/navigation'

import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './Dock.module.css'

type DockProps = {
  strings: UiStringsMap
}

/** Нижні кнопки нотатки/критичної проблеми — доступні протягом усієї роботи. */
export function Dock({ strings }: DockProps) {
  const router = useRouter()
  const tt = (key: string) => t(strings, key)

  return (
    <div className={styles.dock}>
      <button className={`glass ${styles.btn}`} onClick={() => router.push('/report?kind=note')}>
        {tt('shared.dock_note')}
      </button>
      <button
        className={`glass ${styles.btn} ${styles.stop}`}
        onClick={() => router.push('/report?kind=critical')}
      >
        {tt('shared.dock_critical')}
      </button>
    </div>
  )
}
