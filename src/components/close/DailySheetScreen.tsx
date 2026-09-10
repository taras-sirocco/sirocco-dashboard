'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import type { CommentEntry } from '@/lib/comments'
import type { TaskWithProgress } from '@/lib/tasksFormat'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './DailySheetScreen.module.css'

type DailySheetScreenProps = {
  strings: UiStringsMap
  workerName: string
  tasks: TaskWithProgress[]
  comments: CommentEntry[]
}

export function DailySheetScreen({ strings, workerName, tasks, comments }: DailySheetScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [showRecorder, setShowRecorder] = useState(false)
  const [note, setNote] = useState('')
  const [hadVoice, setHadVoice] = useState(false)
  const [busy, setBusy] = useState(false)

  async function sendComment() {
    const text = note || (hadVoice ? 'голосовий запис' : '')
    if (!text || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/app/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) {
        setNote('')
        setHadVoice(false)
        setShowRecorder(false)
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  function badgeFor(task: TaskWithProgress) {
    if (task.done >= task.targetQty) return { cls: styles.bDone, label: tt('close.badge_done') }
    if (task.done > 0) return { cls: styles.bPart, label: tt('close.badge_partial') }
    return { cls: styles.bNotStarted, label: tt('close.badge_not_started') }
  }

  const contextLabel = (ctx: CommentEntry['contextType']) =>
    ctx === 'task' ? tt('close.context_task') : ctx === 'step' ? tt('close.context_step') : null

  return (
    <>
      <ShiftStatusBar strings={strings} name={workerName} />
      <main className={styles.main}>
        <div className={styles.eyebrow}>{tt('close.sheet_eyebrow')}</div>
        <h1 className={styles.h1}>{tt('close.sheet_title')}</h1>
        <p className={styles.sub}>{tt('close.sheet_sub')}</p>

        <div className={styles.sect}>{tt('close.sheet_section_tasks')}</div>
        {tasks.map((task) => {
          const badge = badgeFor(task)
          return (
            <div key={task.id} className={`glass ${styles.trow}`}>
              <span className={`${styles.badge} ${badge.cls}`}>{badge.label}</span>
              <span className={styles.tn}>{task.title}</span>
              <span className={styles.tq}>
                {task.done} <small>{tt('close.of_target_template', { target: String(task.targetQty) })}</small>
              </span>
            </div>
          )
        })}

        <div className={styles.sect}>{tt('close.sheet_section_comments')}</div>
        <p className={styles.sub} style={{ marginTop: -4 }}>
          {tt('close.sheet_comments_note')}
        </p>
        {comments.map((c) => {
          const label = contextLabel(c.contextType)
          return (
            <div key={c.id} className={`glass ${styles.cmt}`}>
              <div className={styles.cmtTop}>
                <span className={styles.tm}>
                  {new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(
                    new Date(c.createdAt),
                  )}
                </span>
                {label && <span className={styles.ctx}>{label}</span>}
              </div>
              <div className={styles.cmtBody}>{c.text}</div>
            </div>
          )
        })}

        {showRecorder ? (
          <VoiceRecorder
            value={note}
            onChange={setNote}
            onRecordingStop={() => setHadVoice(true)}
            idleHint={tt('shared.voice_hint_idle')}
            recordingHint={tt('shared.voice_hint_recording')}
            unavailableHint={tt('shared.voice_hint_unavailable')}
            placeholder={tt('shared.text_placeholder_short')}
            micAriaLabel={tt('shared.mic_aria_label')}
          />
        ) : (
          <div className={styles.addcmt}>
            <button className={`glass ${styles.addcmtBtn}`} onClick={() => setShowRecorder(true)}>
              {tt('close.add_voice')}
            </button>
            <button className={`glass ${styles.addcmtBtn}`} onClick={() => setShowRecorder(true)}>
              {tt('close.add_text')}
            </button>
          </div>
        )}
        {showRecorder && (
          <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={sendComment}>
            {tt('close.add_send')}
          </button>
        )}

        <button className={`glass ${styles.big} ${styles.primary}`} onClick={() => router.push('/close/checklist')}>
          {tt('close.to_closing')}
        </button>
      </main>
    </>
  )
}
