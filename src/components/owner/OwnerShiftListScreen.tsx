'use client'

import { useRouter } from 'next/navigation'

import type { OwnerShiftListItem, QualityStatus } from '@/lib/ownerReport'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './OwnerShiftListScreen.module.css'

type OwnerShiftListScreenProps = {
  strings: UiStringsMap
  ownerName: string
  shifts: OwnerShiftListItem[]
}

const QUALITY_BADGE_KEY: Record<QualityStatus, string> = {
  checked: 'owner.badge_checked',
  not_checked: 'owner.badge_not_checked',
  no_tasks: 'owner.badge_no_tasks',
}
const QUALITY_BADGE_CLASS: Record<QualityStatus, string> = {
  checked: 'badgeChecked',
  not_checked: 'badgeNotChecked',
  no_tasks: 'badgeNoTasks',
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )
}
function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function OwnerShiftListScreen({ strings, ownerName, shifts }: OwnerShiftListScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  return (
    <main className={styles.main}>
      <div className={styles.bar}>{tt('owner.bar_template', { name: ownerName })}</div>
      <div className={styles.eyebrow}>{tt('owner.list_eyebrow')}</div>
      <h1 className={styles.h1}>{tt('owner.list_title')}</h1>

      {shifts.length === 0 ? (
        <p className={styles.empty}>{tt('owner.list_empty')}</p>
      ) : (
        <div className={styles.list}>
          {shifts.map((shift) => (
            <button
              key={shift.shiftId}
              className={`glass ${styles.row}`}
              onClick={() => router.push(`/owner?shiftId=${shift.shiftId}`)}
            >
              <div className={styles.rowTop}>
                <span className={styles.rowDate}>{formatDate(shift.date)}</span>
                <span className={styles[QUALITY_BADGE_CLASS[shift.qualityStatus]]}>
                  {tt(QUALITY_BADGE_KEY[shift.qualityStatus])}
                </span>
              </div>
              <div className={styles.rowResp}>{shift.responsibleName}</div>
              <div className={styles.rowTimes}>
                {shift.openedAt
                  ? tt('owner.row_open_template', { time: formatTime(shift.openedAt) })
                  : ''}
                {shift.closedAt ? (
                  <> · {tt('owner.row_closed_template', { time: formatTime(shift.closedAt) })}</>
                ) : (
                  <> · {tt('owner.row_still_open')}</>
                )}
                {shift.autoClosed && <span className={styles.autoTag}> · {tt('owner.row_auto_closed')}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
