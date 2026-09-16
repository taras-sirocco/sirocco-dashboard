'use client'

import { useRouter } from 'next/navigation'

import type { ShiftQualitySummary } from '@/lib/qualityChecks'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './QualityListScreen.module.css'

type QualityListScreenProps = {
  strings: UiStringsMap
  foremanName: string
  shifts: ShiftQualitySummary[]
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )
}

export function QualityListScreen({ strings, foremanName, shifts }: QualityListScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  return (
    <main className={styles.main}>
      <div className={styles.bar}>
        {tt('quality.foreman_bar_template', { name: foremanName })}
      </div>
      <div className={styles.eyebrow}>{tt('quality.list_eyebrow')}</div>
      <h1 className={styles.h1}>{tt('quality.list_title')}</h1>

      {shifts.length === 0 ? (
        <p className={styles.empty}>{tt('quality.list_empty')}</p>
      ) : (
        <div className={styles.list}>
          {shifts.map((shift) => (
            <button
              key={shift.shiftId}
              className={`glass ${styles.row} ${shift.needsCheck ? styles.needsCheck : ''}`}
              onClick={() => router.push(`/quality?shiftId=${shift.shiftId}`)}
            >
              <div className={styles.rowTop}>
                <span className={styles.rowDate}>{formatDate(shift.date)}</span>
                {shift.isCurrent && <span className={styles.tagCurrent}>{tt('quality.tag_current')}</span>}
                {shift.needsCheck && <span className={styles.tagNeeds}>{tt('quality.tag_needs_check')}</span>}
              </div>
              <div className={styles.rowResp}>{shift.responsibleName}</div>
              <div className={styles.rowSummary}>
                {shift.taskCount === 0
                  ? tt('quality.summary_no_progress')
                  : tt('quality.summary_template', {
                      checked: String(shift.checkedCount),
                      total: String(shift.taskCount),
                    })}
                {shift.hasDefect && <span className={styles.defectDot}>{tt('quality.summary_has_defect')}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
