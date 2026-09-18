'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { OwnerTaskCard as OwnerTaskCardData } from '@/lib/ownerTasks'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './OwnerTaskGridSection.module.css'

type OwnerTaskGridSectionProps = {
  strings: UiStringsMap
  tasks: OwnerTaskCardData[]
}

const TARGET_QTY_DEBOUNCE_MS = 700

export function OwnerTaskGridSection({ strings, tasks }: OwnerTaskGridSectionProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  return (
    <section className={styles.section}>
      <div className={styles.eyebrow}>{tt('owner.tasks_section_eyebrow')}</div>
      <h1 className={styles.h1}>{tt('owner.tasks_section_title')}</h1>

      {tasks.length === 0 ? (
        <p className={styles.empty}>{tt('owner.tasks_section_empty')}</p>
      ) : (
        <div className={styles.grid}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} tt={tt} onChanged={() => router.refresh()} />
          ))}
        </div>
      )}
    </section>
  )
}

type TaskCardProps = {
  task: OwnerTaskCardData
  tt: (key: string, vars?: Record<string, string>) => string
  onChanged: () => void
}

function TaskCard({ task, tt, onChanged }: TaskCardProps) {
  const [targetQty, setTargetQty] = useState(task.targetQty)
  const [savingQty, setSavingQty] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDescription, setEditDescription] = useState(task.description)
  const [savingEdit, setSavingEdit] = useState(false)

  const [error, setError] = useState('')

  async function submitTargetQty(value: number) {
    setSavingQty(true)
    try {
      const res = await fetch(`/api/app/owner/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetQty: value }),
      })
      if (!res.ok) {
        setError(tt('owner.task_target_update_failed'))
        return
      }
      onChanged()
    } catch {
      setError(tt('owner.task_target_update_failed'))
    } finally {
      setSavingQty(false)
    }
  }

  function stepTargetQty(delta: number) {
    const next = Math.max(1, targetQty + delta)
    setTargetQty(next)
    setError('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => submitTargetQty(next), TARGET_QTY_DEBOUNCE_MS)
  }

  async function saveEdit() {
    if (!editTitle.trim() || savingEdit) return
    setSavingEdit(true)
    setError('')
    try {
      const res = await fetch(`/api/app/owner/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
      })
      if (!res.ok) {
        setError(tt('owner.task_save_failed'))
        return
      }
      setEditing(false)
      onChanged()
    } catch {
      setError(tt('owner.task_save_failed'))
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className={`glass ${styles.card}`}>
      <div className={styles.cardTop}>
        <span className={styles.title}>{task.title}</span>
        {task.taskType === 'rework' && <span className={styles.reworkTag}>{tt('owner.rework_tag')}</span>}
      </div>
      {task.description && <div className={styles.desc}>{task.description}</div>}

      {(task.hasProgress || task.isQualityChecked || task.isCompleted) && (
        <div className={styles.badges}>
          {task.isCompleted && <span className={styles.badgeCompleted}>{tt('owner.task_completed_badge')}</span>}
          {task.hasProgress && <span className={styles.badgeProgress}>{tt('owner.task_progress_badge')}</span>}
          {task.isQualityChecked && <span className={styles.badgeChecked}>{tt('owner.task_checked_badge')}</span>}
        </div>
      )}

      <div className={styles.qtyRow}>
        {tt('owner.task_qty_template', { done: String(task.qtyDone), target: String(targetQty) })}
      </div>

      <div className={styles.stepper}>
        <button
          type="button"
          className={`glass ${styles.sbtn}`}
          disabled={targetQty <= 1}
          onClick={() => stepTargetQty(-1)}
        >
          −
        </button>
        <span className={styles.sval}>
          {targetQty}
          {savingQty && <span className={styles.savingDot}>•</span>}
        </span>
        <button type="button" className={`glass ${styles.sbtn}`} onClick={() => stepTargetQty(1)}>
          +
        </button>
      </div>

      {error && <p className={styles.err}>{error}</p>}

      <div className={styles.actions}>
        <button type="button" className={`glass ${styles.actBtn}`} onClick={() => setEditing(true)}>
          {`✎ ${tt('owner.task_edit_button')}`}
        </button>
      </div>

      {editing && (
        <div className={styles.modalOverlay} onClick={() => setEditing(false)}>
          <div className={`glass ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>{tt('owner.task_edit_modal_title')}</div>
            <label className={styles.fieldLabel}>{tt('owner.task_title_label')}</label>
            <input
              className={styles.input}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <label className={styles.fieldLabel}>{tt('owner.task_description_label')}</label>
            <textarea
              className={styles.textarea}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
            <div className={styles.modalActs}>
              <button type="button" className={`glass ${styles.modalCancel}`} onClick={() => setEditing(false)}>
                {tt('owner.task_cancel_button')}
              </button>
              <button
                type="button"
                className={`glass ${styles.modalSave}`}
                disabled={savingEdit || !editTitle.trim()}
                onClick={saveEdit}
              >
                {tt('owner.task_save_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
