'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { NoteField } from '@/components/NoteField'
import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import type { TaskWithProgress } from '@/lib/tasksFormat'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'
import { submitJson } from '@/offline/submit'

import styles from './BlockerScreen.module.css'

type BlockerScreenProps = {
  strings: UiStringsMap
  workerName: string
  gaps: TaskWithProgress[]
}

export function BlockerScreen({ strings, workerName, gaps }: BlockerScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [index, setIndex] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const current = gaps[index]
  const missing = current ? current.targetQty - current.done : 0

  const carryTemplate = strings['blocker.carry_note_template'] ?? 'blocker.carry_note_template'
  const [carryBefore, carryAfter] = carryTemplate.split('{qty}')

  async function send() {
    if (!current || busy) return
    setBusy(true)
    try {
      const result = await submitJson('/api/app/blockers/gap', 'blocker-gap', {
        taskId: current.id,
        text: note.trim() || undefined,
      })

      if (result.ok) {
        setNote('')
        if (index + 1 < gaps.length) {
          setIndex(index + 1)
        } else {
          router.push('/close')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  if (!current) return null

  return (
    <>
      <ShiftStatusBar strings={strings} name={workerName} />
      <div className={styles.dots}>
        {gaps.map((_, i) => (
          <span key={i} className={`${styles.pd} ${i < index ? styles.done : i === index ? styles.cur : ''}`} />
        ))}
      </div>

      <main className={styles.main}>
        <div className={styles.eyebrow}>
          {tt('blocker.position_template', { n: String(index + 1), total: String(gaps.length) })}
        </div>
        <h1 className={styles.h1}>{tt('blocker.title')}</h1>

        <div className={`glass ${styles.gap}`}>
          <div className={styles.tn}>{current.title}</div>
          <div className={styles.nums}>
            <span className={styles.big}>{current.done}</span>
            <span className={styles.of}>
              {tt('blocker.of_target_template', { target: String(current.targetQty) })}
            </span>
            <span className={styles.miss}>{tt('blocker.miss_template', { n: String(missing) })}</span>
          </div>
          <div className={styles.track}>
            <span
              className={styles.fill}
              style={{ width: `${Math.min(100, (current.done / current.targetQty) * 100)}%` }}
            />
          </div>
        </div>

        <NoteField value={note} onChange={setNote} placeholder={tt('shared.text_placeholder_short')} />

        <div className={styles.carry}>
          <span className={styles.carryIc}>↻</span>
          <span>
            {carryBefore}
            <b>{missing} шт</b>
            {carryAfter}
          </span>
        </div>

        <button className={`glass ${styles.cta}`} disabled={busy} onClick={send}>
          {tt('blocker.send_button')}
        </button>
      </main>
    </>
  )
}
