'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { NoteField } from '@/components/NoteField'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'
import { submitJson } from '@/offline/submit'

import styles from './ReportScreen.module.css'

type ReportKind = 'note' | 'critical'

type ReportScreenProps = {
  kind: ReportKind
  strings: UiStringsMap
}

/**
 * Нотатка до процесу / критична проблема — доступно з будь-якого екрана
 * зміни (хаб, задачі, кроки) через однакове посилання /report?kind=...
 * Один спільний компонент замість копії логіки на кожному екрані.
 */
export function ReportScreen({ kind, strings }: ReportScreenProps) {
  const router = useRouter()
  const tt = (key: string) => t(strings, key)

  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [queued, setQueued] = useState(false)

  const critical = kind === 'critical'

  async function send() {
    if (busy) return
    if (!note.trim()) return
    setBusy(true)
    try {
      const url = critical ? '/api/app/blockers/critical' : '/api/app/comments'
      const kindTag = critical ? 'blocker-critical' : 'comment'
      const result = await submitJson(url, kindTag, { text: note })

      if (result.ok) {
        setSent(true)
        setQueued(result.queued)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.main}>
      <button className={styles.back} onClick={() => router.back()}>
        {tt('shared.back_link')}
      </button>
      <div className={styles.eyebrow}>{critical ? tt('hub.critical_eyebrow') : tt('hub.note_eyebrow')}</div>

      {sent ? (
        <p className={styles.sub}>{queued ? tt('shared.queued_offline_notice') : tt('hub.send_confirmation')}</p>
      ) : (
        <>
          <h1 className={styles.h1}>{critical ? tt('hub.critical_title') : tt('hub.note_title')}</h1>
          <p className={styles.sub}>{critical ? tt('hub.critical_sub') : tt('hub.note_sub')}</p>
          <NoteField value={note} onChange={setNote} placeholder={tt('shared.text_placeholder_short')} />
          <div className={styles.acts}>
            <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={send}>
              {critical ? tt('hub.send_button_critical') : tt('hub.send_button')}
            </button>
          </div>
        </>
      )}
    </main>
  )
}
