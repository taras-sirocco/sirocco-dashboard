'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import type { ChangesLogEntry } from '@/lib/changesLog'
import type { TaskWithProgress } from '@/lib/tasks'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './HubScreen.module.css'

type View = 'hub' | 'changes' | 'note' | 'critical'

type HubScreenProps = {
  strings: UiStringsMap
  workerName: string
  tasks: TaskWithProgress[]
  changes: { entries: ChangesLogEntry[]; newCount: number }
}

export function HubScreen({ strings, workerName, tasks, changes }: HubScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [view, setView] = useState<View>('hub')
  const [note, setNote] = useState('')
  const [hadVoice, setHadVoice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const currentIndex = tasks.findIndex((task) => task.done < task.targetQty)
  const allDone = tasks.length > 0 && currentIndex === -1
  const current = allDone ? null : tasks[currentIndex] ?? null
  const inProgress = tasks.filter((task) => task.done < task.targetQty).length

  function openRecorder(kind: 'note' | 'critical') {
    setNote('')
    setHadVoice(false)
    setSent(false)
    setView(kind)
  }

  async function send() {
    if (busy) return
    const text = note || (hadVoice ? 'голосовий запис' : '')
    if (!text) return
    setBusy(true)
    try {
      const url = view === 'critical' ? '/api/app/blockers/critical' : '/api/app/comments'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (res.ok) setSent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.main}>
      {/* --- ХАБ --- */}
      <section className={`${styles.view} ${view === 'hub' ? styles.on : ''}`}>
        <ShiftStatusBar strings={strings} name={workerName} />
        <div className={styles.eyebrow}>{tt('hub.eyebrow')}</div>
        <h1 className={styles.h1}>{tt('hub.title')}</h1>
        <p className={styles.sub}>
          {tasks.length === 0
            ? tt('hub.no_tasks')
            : tt('hub.sub_template', { total: String(tasks.length), inProgress: String(inProgress) })}
        </p>

        {current && (
          <div className={`glass ${styles.hero}`}>
            <div className={styles.heroLab}>{tt('hub.current_task_label')}</div>
            <div className={styles.heroCur}>
              {tt('hub.current_task_template', {
                title: current.title,
                done: String(current.done),
                target: String(current.targetQty),
              })}
            </div>
            <div className={styles.heroProg}>
              {tasks.map((task, i) => (
                <span
                  key={task.id}
                  className={`${styles.heroSeg} ${
                    task.done >= task.targetQty ? styles.done : i === currentIndex ? styles.cur : ''
                  }`}
                />
              ))}
            </div>
            <div className={styles.heroMeta}>
              {tt('hub.current_task_meta', {
                n: String(currentIndex + 1),
                total: String(tasks.length),
                remaining: String(current.targetQty - current.done),
              })}
            </div>
          </div>
        )}

        <button className={`glass ${styles.cta}`} onClick={() => router.push('/tasks')}>
          {allDone ? tt('task.to_daily_sheet') : tt('hub.continue_button')}
        </button>

        <div className={styles.tiles}>
          <button className={`glass ${styles.tile}`} onClick={() => openRecorder('note')}>
            <span className={styles.tileIc}>📝</span>
            <span className={styles.tileT}>{tt('shared.dock_note')}</span>
          </button>
          <button className={`glass ${styles.tile} ${styles.crit}`} onClick={() => openRecorder('critical')}>
            <span className={styles.tileIc}>⚠️</span>
            <span className={styles.tileT}>{tt('shared.dock_critical')}</span>
          </button>
          <button className={`glass ${styles.tile} ${styles.wide}`} onClick={() => setView('changes')}>
            <span className={styles.tileIc}>✨</span>
            <span className={styles.tileT}>{tt('hub.changes_tile')}</span>
            {changes.newCount > 0 && <span className={styles.badge}>{changes.newCount}</span>}
          </button>
          <button className={`glass ${styles.tile} ${styles.wide}`} onClick={() => router.push('/close')}>
            <span className={styles.tileIc}>🌙</span>
            <span className={styles.tileT}>{tt('hub.close_shift_tile')}</span>
          </button>
        </div>
      </section>

      {/* --- ЩО ЗМІНИЛИ --- */}
      <section className={`${styles.view} ${view === 'changes' ? styles.on : ''}`}>
        <button className={styles.back} onClick={() => setView('hub')}>
          {tt('shared.back_link')}
        </button>
        <div className={styles.eyebrow}>{tt('hub.changes_eyebrow')}</div>
        <h1 className={styles.h1}>{tt('hub.changes_title')}</h1>
        <p className={styles.sub}>{tt('hub.changes_sub')}</p>
        {changes.entries.map((entry) => (
          <div key={entry.id} className={`glass ${styles.chg}`}>
            <div className={styles.chgDate}>
              {new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(new Date(entry.date))}
            </div>
            <div className={styles.chgSaid}>{entry.whatWasSaid}</div>
            <div className={styles.chgDid}>
              <span className={styles.chgDidMark}>✓</span>
              <span>{entry.whatChanged}</span>
            </div>
          </div>
        ))}
      </section>

      {/* --- НОТАТКА / КРИТИЧНА ПРОБЛЕМА --- */}
      <section className={`${styles.view} ${view === 'note' || view === 'critical' ? styles.on : ''}`}>
        <button className={styles.back} onClick={() => setView('hub')}>
          {tt('shared.back_link')}
        </button>
        <div className={styles.eyebrow}>
          {view === 'critical' ? tt('hub.critical_eyebrow') : tt('hub.note_eyebrow')}
        </div>
        {sent ? (
          <p className={styles.sub}>{tt('hub.send_confirmation')}</p>
        ) : (
          <>
            <h1 className={styles.h1}>{view === 'critical' ? tt('hub.critical_title') : tt('hub.note_title')}</h1>
            <p className={styles.sub}>{view === 'critical' ? tt('hub.critical_sub') : tt('hub.note_sub')}</p>
            <VoiceRecorder
              value={note}
              onChange={setNote}
              onRecordingStop={() => setHadVoice(true)}
              critical={view === 'critical'}
              idleHint={tt('hub.voice_hint_idle')}
              recordingHint={tt('shared.voice_hint_recording')}
              unavailableHint={tt('shared.voice_hint_unavailable')}
              placeholder={tt('shared.text_placeholder_short')}
              micAriaLabel={tt('hub.mic_aria_label')}
            />
            <div className={styles.acts}>
              <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={send}>
                {view === 'critical' ? tt('hub.send_button_critical') : tt('hub.send_button')}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
