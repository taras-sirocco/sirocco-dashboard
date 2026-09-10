'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'
import type { ChecklistItem } from '@/lib/checklistTemplates'

import styles from './OpeningScreen.module.css'

type Step = 'start' | 'question' | 'problem' | 'handover' | 'notReadyReason' | 'done'

type OpeningScreenProps = {
  strings: UiStringsMap
  workerName: string
  items: ChecklistItem[]
}

export function OpeningScreen({ strings, workerName, items }: OpeningScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [step, setStep] = useState<Step>('start')
  const [index, setIndex] = useState(0)
  const [shiftId, setShiftId] = useState<number | null>(null)
  const [runId, setRunId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [hadVoice, setHadVoice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notReadySent, setNotReadySent] = useState(false)

  const current = items[index]
  const showProgress = step === 'question' || step === 'problem'

  async function begin() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/app/shifts/open', { method: 'POST' })
      if (!res.ok) return
      const data = (await res.json()) as { shiftId: number; runId?: number; alreadyOpen: boolean }
      if (data.alreadyOpen) {
        router.push('/hub')
        return
      }
      setShiftId(data.shiftId)
      setRunId(data.runId ?? null)
      setIndex(0)
      setStep('question')
    } finally {
      setBusy(false)
    }
  }

  function advance() {
    if (index + 1 < items.length) {
      setIndex(index + 1)
      setStep('question')
    } else {
      setStep('handover')
    }
  }

  async function answer(status: 'ok' | 'problem', noteText?: string) {
    if (!runId || !current || busy) return
    setBusy(true)
    try {
      await fetch('/api/app/checklist/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, itemKey: current.key, status, note: noteText }),
      })
      advance()
    } finally {
      setBusy(false)
    }
  }

  function openProblem() {
    setNote('')
    setHadVoice(false)
    setStep('problem')
  }

  async function sendProblem() {
    const text = note || (hadVoice ? 'голосовий запис' : '')
    await answer('problem', text || undefined)
  }

  async function handover(accepted: boolean) {
    if (!shiftId || busy) return
    if (!accepted) {
      setNote('')
      setHadVoice(false)
      setStep('notReadyReason')
      return
    }
    setBusy(true)
    try {
      await fetch('/api/app/shifts/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId, accepted: true }),
      })
      setStep('done')
    } finally {
      setBusy(false)
    }
  }

  async function sendNotReady() {
    if (!shiftId || busy) return
    setBusy(true)
    try {
      const text = note || (hadVoice ? 'голосовий запис' : '')
      await fetch('/api/app/shifts/handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId, accepted: false, note: text || undefined }),
      })
      setNotReadySent(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.main}>
      {showProgress && (
        <div className={styles.prog}>
          <span className={styles.pcount}>
            {tt('opening.progress_template', { n: String(index + 1), total: String(items.length) })}
          </span>
          <span className={styles.ptrack}>
            <span className={styles.pfill} style={{ width: `${(index / items.length) * 100}%` }} />
          </span>
        </div>
      )}

      <section className={`${styles.step} ${step === 'start' ? styles.on : ''}`}>
        <div className={styles.eyebrow}>{tt('opening.responsible_eyebrow', { name: workerName })}</div>
        <h1 className={styles.h1}>{tt('opening.title')}</h1>
        {/* eslint-disable-next-line react/no-danger -- текст з uiStrings (адмінка), не від користувача */}
        <p className={styles.sub} dangerouslySetInnerHTML={{ __html: tt('opening.intro') }} />
        <div className={styles.acts}>
          <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={begin}>
            {tt('opening.start_button')}
          </button>
        </div>
      </section>

      <section className={`${styles.step} ${step === 'question' ? styles.on : ''}`}>
        {current && (
          <>
            <div className={styles.qplain}>{current.text}</div>
            <div className={styles.acts}>
              <button
                className={`glass ${styles.big} ${styles.primary}`}
                disabled={busy}
                onClick={() => answer('ok')}
              >
                {tt('opening.yes')}
              </button>
              <button className={`glass ${styles.big} danger-solid`} disabled={busy} onClick={openProblem}>
                {tt('opening.no')}
              </button>
            </div>
          </>
        )}
      </section>

      <section className={`${styles.step} ${step === 'problem' ? styles.on : ''}`}>
        <div className={styles.eyebrow}>{tt('opening.problem_eyebrow')}</div>
        <h1 className={styles.h1}>{tt('opening.problem_title')}</h1>
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
        <div className={styles.acts}>
          <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={sendProblem}>
            {tt('opening.problem_send')}
          </button>
        </div>
      </section>

      <section className={`${styles.step} ${step === 'handover' ? styles.on : ''}`}>
        <div className={styles.eyebrow}>{tt('opening.handover_eyebrow')}</div>
        <div className={`glass ${styles.qcard}`}>
          <div className={styles.qtext}>{tt('opening.handover_question')}</div>
          <p className={styles.sub}>{tt('opening.handover_note')}</p>
        </div>
        <div className={styles.acts}>
          <button
            className={`glass ${styles.big} ${styles.primary}`}
            disabled={busy}
            onClick={() => handover(true)}
          >
            {tt('opening.handover_yes')}
          </button>
          <button
            className={`glass ${styles.big} danger-solid`}
            disabled={busy}
            onClick={() => handover(false)}
          >
            {tt('opening.no')}
          </button>
        </div>
      </section>

      <section className={`${styles.step} ${step === 'notReadyReason' ? styles.on : ''}`}>
        {notReadySent ? (
          <>
            <div className={styles.eyebrow}>{tt('opening.not_ready_eyebrow')}</div>
            <p className={styles.sub}>{tt('opening.not_ready_sent_confirmation')}</p>
          </>
        ) : (
          <>
            <div className={styles.eyebrow}>{tt('opening.not_ready_eyebrow')}</div>
            <h1 className={styles.h1}>{tt('opening.not_ready_title')}</h1>
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
            <div className={styles.acts}>
              <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={sendNotReady}>
                {tt('opening.not_ready_send')}
              </button>
            </div>
          </>
        )}
      </section>

      <section className={`${styles.step} ${step === 'done' ? styles.on : ''}`}>
        <ShiftStatusBar strings={strings} name={workerName} />
        <div className={styles.done}>
          <div className={`glass ${styles.doneIni}`}>✓</div>
          <div className={styles.eyebrow}>{tt('opening.done_eyebrow')}</div>
          <h1 className={styles.h1}>{workerName}</h1>
        </div>
        <div className={styles.acts}>
          <button className={`glass ${styles.big} ${styles.primary}`} onClick={() => router.push('/hub')}>
            {tt('opening.to_tasks')}
          </button>
        </div>
      </section>
    </main>
  )
}
