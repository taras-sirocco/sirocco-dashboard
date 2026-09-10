'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Dock } from '@/components/Dock'
import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import { getCurrentTaskIndex, type TaskWithProgress } from '@/lib/tasksFormat'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './TaskScreen.module.css'

type Step = 'task' | 'qty'

type TaskScreenProps = {
  strings: UiStringsMap
  workerName: string
  tasks: TaskWithProgress[]
}

export function TaskScreen({ strings, workerName, tasks }: TaskScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [step, setStep] = useState<Step>('task')
  const [qty, setQty] = useState(1)
  const [busy, setBusy] = useState(false)

  const currentIndex = getCurrentTaskIndex(tasks)
  const allDone = tasks.length > 0 && currentIndex === -1
  const current = allDone ? null : tasks[currentIndex] ?? null

  function openQty() {
    setQty(1)
    setStep('qty')
  }

  async function confirm() {
    if (!current || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/app/tasks/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: current.id, qty }),
      })
      if (res.ok) {
        setStep('task')
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  if (allDone) {
    return (
      <main className={styles.main}>
        <ShiftStatusBar strings={strings} name={workerName} />
        <div className={styles.done}>
          <div className={styles.doneIni}>✓</div>
          <h1>{tt('task.all_done_title')}</h1>
          <p>{tt('task.all_done_sub')}</p>
        </div>
        <button className={`glass ${styles.big} ${styles.primary}`} onClick={() => router.push('/blocker')}>
          {tt('task.to_daily_sheet')}
        </button>
      </main>
    )
  }

  return (
    <>
      <ShiftStatusBar strings={strings} name={workerName} />
      <main className={styles.main}>
        <section className={`${styles.step} ${step === 'task' ? styles.on : ''}`}>
          <div className={styles.queue}>
            {tasks.map((task, i) => (
              <span
                key={task.id}
                className={`${styles.qseg} ${
                  task.done >= task.targetQty ? styles.done : i === currentIndex ? styles.cur : ''
                }`}
              />
            ))}
          </div>
          <div className={styles.pos}>
            {tt('task.position_template', { n: String(currentIndex + 1), total: String(tasks.length) })}
          </div>
          <div className={styles.tname}>{current?.title}</div>

          <div className={`glass ${styles.counter}`}>
            <div className={styles.crow}>
              <span className={styles.clabel}>{tt('task.progress_label')}</span>
              <span className={styles.cval}>
                {current?.done} <small>{tt('task.progress_of_template', { target: String(current?.targetQty ?? 0) })}</small>
              </span>
            </div>
            <div className={styles.ctrack}>
              <span
                className={styles.cfill}
                style={{ width: `${Math.min(100, ((current?.done ?? 0) / (current?.targetQty || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <button
            className={`glass ${styles.instr}`}
            onClick={() => router.push(`/steps?taskId=${current?.id}`)}
          >
            {tt('task.instructions_button')}
          </button>

          <button className={`glass ${styles.big} ${styles.primary}`} onClick={openQty}>
            {(current?.done ?? 0) > 0 ? tt('task.done_button_with_progress') : tt('task.done_button')}
          </button>
        </section>

        <section className={`${styles.step} ${step === 'qty' ? styles.on : ''}`}>
          <div className={styles.pos}>{tt('task.qty_prompt')}</div>
          <div className={styles.tname} style={{ fontSize: 'clamp(24px,4.6vw,32px)', marginBottom: 20 }}>
            {current?.title}
          </div>

          <div className={styles.stepper}>
            <button
              className={`glass ${styles.sbtn}`}
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <div className={styles.snum}>{qty}</div>
            <button className={`glass ${styles.sbtn}`} onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>

          <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={confirm}>
            {tt('task.qty_confirm')}
          </button>
          <button className={`glass ${styles.instr}`} style={{ marginTop: 12 }} onClick={() => setStep('task')}>
            {tt('shared.back')}
          </button>
        </section>
      </main>
      <Dock strings={strings} />
    </>
  )
}
