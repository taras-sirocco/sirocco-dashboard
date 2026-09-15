'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Dock } from '@/components/Dock'
import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import type { TaskWithProgress } from '@/lib/tasksFormat'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'
import { submitJson } from '@/offline/submit'

import styles from './TaskScreen.module.css'

type TaskScreenProps = {
  strings: UiStringsMap
  workerName: string
  tasks: TaskWithProgress[]
}

export function TaskScreen({ strings, workerName, tasks: initialTasks }: TaskScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  // Локальна копія — оптимістичний UI оновлює її одразу, не чекаючи мережі.
  // Сервер лишається єдиним джерелом правди (BFF рахує реальний done й сам
  // вирішує, чи задача закрита), клієнт лише коректно передбачає результат.
  const [tasks, setTasks] = useState(initialTasks)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  // Задачі, що щойно закрились — коротко показують "✓ Закрито" замість
  // раптового зникнення з сітки, потім самі себе прибирають зі списку.
  const [closingIds, setClosingIds] = useState<Set<number>>(new Set())
  // "Закрити зміну" — дія кінця зміни, тому вимагає другого підтвердження,
  // щоб не натиснулась випадково посеред роботи.
  const [confirmingClose, setConfirmingClose] = useState(false)

  // Список тепер = усі НЕЗАКРИТІ задачі (сервер уже відфільтрував). Якщо
  // почали з непорожнього списку й він спорожнів — усе зроблено. Якщо
  // спорожнів був із самого початку — задач просто ще не поставили.
  const hadTasks = initialTasks.length > 0
  const allDone = hadTasks && tasks.length === 0

  async function confirm(taskId: number, qty: number) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    const previousTasks = tasks
    const wasOpen = task.done < task.targetQty

    setErrors((prev) => ({ ...prev, [taskId]: '' }))
    setSavingIds((prev) => new Set(prev).add(taskId))
    // Оптимістично: цифра оновлюється миттєво, перебір (10/9) показуємо як є.
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: t.done + qty } : t)))

    const result = await submitJson('/api/app/tasks/progress', 'task-progress', { taskId, qty })

    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })

    if (!result.ok) {
      // Відкат: те, що показали, не збереглось насправді (реальна помилка
      // сервера — не мережа: мережеву відсутність submitJson сам поставив
      // у чергу й повернув ok:true, queued:true).
      setTasks(previousTasks)
      setErrors((prev) => ({ ...prev, [taskId]: tt('task.progress_save_failed') }))
      return
    }

    // Авторитетне "закрито" — з відповіді сервера, коли вона прийшла одразу.
    // З офлайн-черги (queued) відповіді ще нема — оцінюємо локально, синк
    // дожене справжній стан пізніше.
    const data = result.queued ? null : (result.data as { closed?: boolean } | null)
    const justClosed = data ? Boolean(data.closed) : wasOpen && task.done + qty >= task.targetQty

    if (justClosed) {
      setClosingIds((prev) => new Set(prev).add(taskId))
      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        setClosingIds((prev) => {
          const next = new Set(prev)
          next.delete(taskId)
          return next
        })
      }, 1600)
    }
  }

  return (
    <>
      <ShiftStatusBar strings={strings} name={workerName} />
      <main className={styles.main}>
        <h1 className={styles.h1}>{tt('task.grid_title')}</h1>

        {allDone && (
          <div className={`glass ${styles.doneBanner}`}>
            <div className={styles.doneIni}>✓</div>
            <div className={styles.doneText}>
              <div className={styles.doneTitle}>{tt('task.all_done_title')}</div>
              <div className={styles.doneSub}>{tt('task.all_done_sub')}</div>
            </div>
            <button className={`glass ${styles.doneCta}`} onClick={() => router.push('/blocker')}>
              {tt('task.to_daily_sheet')}
            </button>
          </div>
        )}

        {tasks.length === 0 ? (
          hadTasks ? null : <p className={styles.empty}>{tt('task.grid_empty')}</p>
        ) : (
          <div className={styles.grid}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                tt={tt}
                error={errors[task.id]}
                saving={savingIds.has(task.id)}
                closing={closingIds.has(task.id)}
                onConfirm={(qty) => confirm(task.id, qty)}
              />
            ))}
          </div>
        )}

        <div className={styles.closeShiftZone}>
          {confirmingClose ? (
            <div className={`glass ${styles.closeConfirm}`}>
              <div className={styles.closeConfirmLabel}>{tt('close.confirm_eyebrow')}</div>
              <div className={styles.closeConfirmActs}>
                <button
                  type="button"
                  className={`glass ${styles.closeConfirmBack}`}
                  onClick={() => setConfirmingClose(false)}
                >
                  {tt('shared.back')}
                </button>
                <button
                  type="button"
                  className={`glass ${styles.closeConfirmGo} danger-solid`}
                  onClick={() => router.push('/blocker')}
                >
                  {tt('hub.close_shift_tile')}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.closeShiftBtn}
              onClick={() => setConfirmingClose(true)}
            >
              {tt('hub.close_shift_tile')}
            </button>
          )}
        </div>
      </main>
      <Dock strings={strings} />
    </>
  )
}

type TaskCardProps = {
  task: TaskWithProgress
  tt: (key: string, vars?: Record<string, string>) => string
  error?: string
  saving: boolean
  closing: boolean
  onConfirm: (qty: number) => void
}

function TaskCard({ task, tt, error, saving, closing, onConfirm }: TaskCardProps) {
  const [qty, setQty] = useState(1)
  const isDone = task.done >= task.targetQty
  const pct = Math.min(100, (task.done / (task.targetQty || 1)) * 100)

  function setQtyFromInput(value: string) {
    const n = Math.trunc(Number(value))
    setQty(Number.isFinite(n) && n >= 1 ? n : 1)
  }

  function handleConfirm() {
    if (saving) return
    onConfirm(qty)
    setQty(1)
  }

  if (closing) {
    return (
      <div className={`glass ${styles.card} ${styles.cardClosing}`}>
        <div className={styles.closingBadge}>✓</div>
        <div className={styles.closingTitle}>{tt('task.closed_title')}</div>
        <div className={styles.closingSub}>{task.title}</div>
      </div>
    )
  }

  return (
    <div className={`glass ${styles.card} ${isDone ? styles.cardDone : ''}`}>
      {isDone && <div className={styles.badge}>✓</div>}
      <div className={styles.title}>{task.title}</div>
      {task.description && <div className={styles.desc}>{task.description}</div>}

      <div className={styles.progress}>
        <div className={styles.progRow}>
          <span className={styles.progLabel}>{tt('task.progress_label')}</span>
          <span className={styles.progVal}>
            {task.done} <small>{tt('task.progress_of_template', { target: String(task.targetQty) })}</small>
          </span>
        </div>
        <div className={styles.ptrack}>
          <span className={styles.pfill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={styles.stepper}>
        <button
          type="button"
          className={`glass ${styles.sbtn}`}
          disabled={qty <= 1}
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <input
          className={styles.sinput}
          type="number"
          inputMode="numeric"
          min={1}
          value={qty}
          onChange={(e) => setQtyFromInput(e.target.value)}
        />
        <button type="button" className={`glass ${styles.sbtn}`} onClick={() => setQty((q) => q + 1)}>
          +
        </button>
      </div>

      {error && <p className={styles.err}>{error}</p>}

      <button className={`glass ${styles.confirm}`} disabled={saving} onClick={handleConfirm}>
        {tt('task.done_button')}
      </button>
    </div>
  )
}
