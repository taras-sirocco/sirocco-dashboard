'use client'

import { useEffect, useState } from 'react'

import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './BroadcastGate.module.css'

type PendingBroadcast = {
  id: number
  kind: 'message' | 'task'
  body: string
  extra: string
  fromLabel: string
}

const POLL_MS = 20_000

/**
 * Повноекранна модалка непідтверджених повідомлень/задач — монтується на
 * кожному екрані зміни, не закривається нічим окрім кнопки підтвердження.
 * Не навігує нікуди: оверлей поверх поточної сторінки, тому «повернення
 * рівно туди» відбувається само собою — сторінка під низом нікуди не діла.
 */
export function BroadcastGate() {
  const [strings, setStrings] = useState<UiStringsMap | null>(null)
  const [queue, setQueue] = useState<PendingBroadcast[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      const [stringsRes, pendingRes] = await Promise.all([
        strings ? Promise.resolve(null) : fetch('/api/app/ui-strings?groups=hub,shared'),
        fetch('/api/app/broadcasts/pending'),
      ])
      if (cancelled) return
      if (stringsRes) {
        const data = (await stringsRes.json()) as { strings: UiStringsMap }
        setStrings(data.strings)
      }
      if (pendingRes.ok) {
        const data = (await pendingRes.json()) as { items: PendingBroadcast[] }
        setQueue(data.items)
      }
    }

    void poll()
    const interval = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
    // strings навмисно не в deps — інакше кожен poll() після першого
    // завантаження текстів перезапускав би інтервал.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = queue[0]

  useEffect(() => {
    if (!current) return
    fetch(`/api/app/broadcasts/${current.id}/shown`, { method: 'POST' })
  }, [current?.id])

  if (!current || !strings) return null

  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)
  const isTask = current.kind === 'task'

  async function ack() {
    if (busy) return
    setBusy(true)
    try {
      await fetch(`/api/app/broadcasts/${current.id}/ack`, { method: 'POST' })
      setQueue((prev) => prev.slice(1))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${isTask ? styles.task : styles.message}`}>
        <div className={styles.kind}>{isTask ? tt('hub.modal_kind_task') : tt('hub.modal_kind_message')}</div>
        <div className={styles.from}>{current.fromLabel}</div>
        <div className={styles.body}>{current.body}</div>
        {current.extra && <div className={styles.extra}>{current.extra}</div>}
        <button className={styles.ack} disabled={busy} onClick={ack}>
          {isTask ? tt('hub.modal_ack_task') : tt('hub.modal_ack_message')}
        </button>
      </div>
    </div>
  )
}
