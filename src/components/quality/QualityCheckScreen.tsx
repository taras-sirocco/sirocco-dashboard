'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { ShiftQualityDetail } from '@/lib/qualityChecks'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './QualityCheckScreen.module.css'

type QualityCheckScreenProps = {
  strings: UiStringsMap
  foremanName: string
  detail: ShiftQualityDetail
}

type RowState = {
  taskId: number
  title: string
  taskType: 'production' | 'rework'
  qtyDone: number
  qtyAccepted: number
  comment: string
  hadExistingCheck: boolean
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )
}

export function QualityCheckScreen({ strings, foremanName, detail }: QualityCheckScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [rows, setRows] = useState<RowState[]>(
    detail.rows.map((row) => ({
      taskId: row.taskId,
      title: row.title,
      taskType: row.taskType,
      qtyDone: row.qtyDone,
      // Дефолт: усе прийнято, поки бригадир сам не зменшить — не заявка
      // на «навмисний брак», а щоб не заповнювати вручну щасливий шлях.
      qtyAccepted: row.qtyAccepted ?? row.qtyDone,
      comment: row.comment,
      hadExistingCheck: row.qtyAccepted !== null,
    })),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const hadAnyExistingCheck = rows.some((row) => row.hadExistingCheck)

  function updateAccepted(taskId: number, value: string) {
    const n = Math.trunc(Number(value))
    setRows((prev) =>
      prev.map((row) =>
        row.taskId === taskId
          ? { ...row, qtyAccepted: Number.isFinite(n) ? Math.max(0, Math.min(n, row.qtyDone)) : 0 }
          : row,
      ),
    )
  }

  function updateComment(taskId: number, value: string) {
    setRows((prev) => prev.map((row) => (row.taskId === taskId ? { ...row, comment: value } : row)))
  }

  const missingComment = rows.some((row) => row.qtyAccepted < row.qtyDone && !row.comment.trim())

  async function submit() {
    if (submitting || missingComment) return
    setSubmitting(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/app/quality/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: detail.shiftId,
          checks: rows.map((row) => ({
            taskId: row.taskId,
            qtyAccepted: row.qtyAccepted,
            comment: row.comment.trim() || undefined,
          })),
        }),
      })
      if (!res.ok) {
        setError(tt('quality.submit_failed'))
        return
      }
      setSuccess(true)
      setRows((prev) => prev.map((row) => ({ ...row, hadExistingCheck: true })))
      router.refresh()
    } catch {
      setError(tt('quality.submit_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.main}>
      <button className={styles.back} onClick={() => router.push('/quality')}>
        {tt('shared.back_link')}
      </button>

      <div className={styles.bar}>{tt('quality.foreman_bar_template', { name: foremanName })}</div>
      <div className={styles.eyebrow}>{formatDate(detail.date)}</div>
      <h1 className={styles.h1}>{detail.responsibleName}</h1>

      {!detail.isEditable && (
        <div className={`glass ${styles.readonlyNote}`}>{tt('quality.readonly_note')}</div>
      )}

      {rows.length === 0 ? (
        <p className={styles.empty}>{tt('quality.no_progress')}</p>
      ) : (
        <div className={styles.list}>
          {rows.map((row) => {
            const hasDefect = row.qtyAccepted < row.qtyDone
            return (
              <div key={row.taskId} className={`glass ${styles.card} ${hasDefect ? styles.cardDefect : ''}`}>
                <div className={styles.cardTop}>
                  <span className={styles.title}>{row.title}</span>
                  {row.taskType === 'rework' && <span className={styles.reworkTag}>{tt('quality.rework_tag')}</span>}
                </div>

                <div className={styles.doneRow}>
                  <span className={styles.doneLabel}>{tt('quality.qty_done_label')}</span>
                  <span className={styles.doneVal}>{row.qtyDone}</span>
                </div>

                <label className={styles.fieldLabel}>{tt('quality.qty_accepted_label')}</label>
                <input
                  className={styles.acceptedInput}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={row.qtyDone}
                  value={row.qtyAccepted}
                  disabled={!detail.isEditable}
                  onChange={(e) => updateAccepted(row.taskId, e.target.value)}
                />

                {hasDefect && (
                  <>
                    <div className={styles.defectNote}>
                      {tt('quality.defect_template', { n: String(row.qtyDone - row.qtyAccepted) })}
                    </div>
                    <label className={styles.fieldLabel}>{tt('quality.comment_label')}</label>
                    <textarea
                      className={styles.commentInput}
                      value={row.comment}
                      disabled={!detail.isEditable}
                      placeholder={tt('quality.comment_placeholder')}
                      onChange={(e) => updateComment(row.taskId, e.target.value)}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {error && <p className={styles.err}>{error}</p>}
      {success && <p className={styles.ok}>{tt('quality.submit_ok')}</p>}

      {detail.isEditable && rows.length > 0 && (
        <button
          className={`glass ${styles.submit}`}
          disabled={submitting || missingComment}
          onClick={submit}
        >
          {hadAnyExistingCheck ? tt('quality.submit_update') : tt('quality.submit_send')}
        </button>
      )}
    </main>
  )
}
