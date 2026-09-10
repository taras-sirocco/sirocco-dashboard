'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Dock } from '@/components/Dock'
import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import type { TaskWithSteps } from '@/lib/taskSteps'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './StepsScreen.module.css'

type View = 'step' | 'reference'

type StepsScreenProps = {
  strings: UiStringsMap
  workerName: string
  task: TaskWithSteps
}

export function StepsScreen({ strings, workerName, task }: StepsScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [index, setIndex] = useState(0)
  const [view, setView] = useState<View>('step')
  const [result, setResult] = useState<'yes' | 'no' | null>(null)
  const [busy, setBusy] = useState(false)

  const total = task.steps.length
  const step = task.steps[index]
  const segments = total + 1 // кроки + звірка з еталоном

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1)
    } else {
      setView('reference')
    }
  }
  function prev() {
    if (index > 0) setIndex(index - 1)
  }

  async function confirmMatch(matches: boolean) {
    if (busy) return
    if (matches) {
      setResult('yes')
      setTimeout(() => router.push('/tasks'), 1500)
      return
    }
    setBusy(true)
    try {
      await fetch('/api/app/blockers/defect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      })
      setResult('no')
      setTimeout(() => router.push('/tasks'), 1800)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ShiftStatusBar strings={strings} name={workerName} />
      <div className={styles.stepsBar}>
        {Array.from({ length: segments }).map((_, i) => (
          <span
            key={i}
            className={`${styles.sg} ${i < index ? styles.done : i === index ? styles.cur : ''} ${
              view === 'reference' ? styles.done : ''
            }`}
          />
        ))}
      </div>

      <main className={styles.main}>
        <section className={`${styles.step} ${view === 'step' ? styles.on : ''}`}>
          {step && (
            <>
              <div className={styles.crumb}>
                <span className={styles.crumbTask}>{task.title}</span>
                <span className={styles.crumbCount}>
                  {tt('steps.position_template', { n: String(index + 1), total: String(total) })}
                </span>
              </div>

              <div className={styles.kicker}>{tt('steps.important_step_label')}</div>
              <div className={styles.title}>{step.title}</div>

              <div className={styles.media}>{tt('steps.media_placeholder')}</div>

              <div className={`glass ${styles.block} ${styles.key}`}>
                <div className={styles.blockLab}>{tt('steps.key_point_label')}</div>
                <div className={styles.blockVal}>{step.keyPoint}</div>
              </div>
              <div className={`glass ${styles.block} ${styles.why}`}>
                <div className={styles.blockLab}>{tt('steps.why_label')}</div>
                <div className={styles.blockVal}>{step.why}</div>
              </div>

              <div className={styles.nav}>
                {index > 0 && (
                  <button className={`glass ${styles.big} ${styles.back}`} onClick={prev}>
                    {tt('shared.back')}
                  </button>
                )}
                <button className={`glass ${styles.big} ${styles.primary}`} onClick={next}>
                  {tt('steps.next_button')}
                </button>
              </div>
            </>
          )}
        </section>

        <section className={`${styles.step} ${view === 'reference' ? styles.on : ''}`}>
          <div className={styles.crumb}>
            <span className={styles.crumbTask}>{task.title}</span>
            <span className={styles.crumbCount}>{tt('steps.reference_check_label')}</span>
          </div>
          <div className={`${styles.kicker} ${styles.ok}`}>{tt('steps.quality_control_label')}</div>
          <div className={styles.title}>{tt('steps.reference_check_title')}</div>

          {result ? (
            <p className={styles.lead}>
              {result === 'yes' ? tt('steps.reference_yes_confirmation') : tt('steps.reference_no_confirmation')}
            </p>
          ) : (
            <>
              <p className={styles.lead}>{task.referenceNote}</p>
              <div className={styles.stack}>
                <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={() => confirmMatch(true)}>
                  {tt('steps.reference_yes')}
                </button>
                <button className={`glass ${styles.big} ${styles.warn}`} disabled={busy} onClick={() => confirmMatch(false)}>
                  {tt('steps.reference_no')}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
      <Dock strings={strings} />
    </>
  )
}
