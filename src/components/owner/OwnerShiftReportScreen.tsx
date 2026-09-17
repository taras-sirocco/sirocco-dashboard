'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { OwnerShiftDetail, QualityStatus } from '@/lib/ownerReport'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './OwnerShiftReportScreen.module.css'

type OwnerShiftReportScreenProps = {
  strings: UiStringsMap
  ownerName: string
  detail: OwnerShiftDetail
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

type SectionProps = {
  title: string
  summary: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, summary, defaultOpen, children }: SectionProps) {
  const [open, setOpen] = useState(Boolean(defaultOpen))
  return (
    <div className={`glass ${styles.section}`}>
      <button type="button" className={styles.sectionHead} onClick={() => setOpen((v) => !v)}>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.sectionSummary}>
          {summary}
          <span className={`${styles.chev} ${open ? styles.chevOpen : ''}`}>›</span>
        </span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}

export function OwnerShiftReportScreen({ strings, ownerName, detail }: OwnerShiftReportScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  function buildLogText(): string {
    const lines: string[] = []
    lines.push(`${tt('owner.list_title')}: ${formatDate(detail.date)}`)
    lines.push(`${tt('owner.field_responsible')}: ${detail.responsibleName}`)
    lines.push(
      `${detail.openedAt ? tt('owner.row_open_template', { time: formatTime(detail.openedAt) }) : ''}` +
        (detail.closedAt
          ? ` · ${tt('owner.row_closed_template', { time: formatTime(detail.closedAt) })}`
          : ` · ${tt('owner.row_still_open')}`) +
        (detail.autoClosed ? ` · ${tt('owner.row_auto_closed')}` : ''),
    )
    lines.push(`${tt('owner.section_quality')}: ${tt(QUALITY_BADGE_KEY[detail.qualityStatus])}`)
    lines.push('')

    lines.push(`${tt('owner.section_tasks')}:`)
    if (detail.tasks.length === 0) {
      lines.push(`  ${tt('owner.section_tasks_empty')}`)
    } else {
      for (const task of detail.tasks) {
        const reworkSuffix = task.taskType === 'rework' ? ` (${tt('owner.rework_tag')})` : ''
        lines.push(`• ${task.title}: ${task.qtyDoneThisShift} з ${task.targetQty}${reworkSuffix}`)
      }
    }
    lines.push('')

    lines.push(`${tt('owner.section_gaps')}:`)
    if (detail.gapReasons.length === 0) {
      lines.push(`  ${tt('owner.section_gaps_empty')}`)
    } else {
      for (const gap of detail.gapReasons) {
        lines.push(`• ${gap.taskTitle}: ${gap.text}`)
      }
    }
    lines.push('')

    lines.push(`${tt('owner.section_quality')}:`)
    if (detail.qualityChecks.length === 0) {
      lines.push(`  ${tt('owner.section_quality_empty')}`)
    } else {
      for (const q of detail.qualityChecks) {
        const commentSuffix = q.comment ? ` — ${q.comment}` : ''
        lines.push(
          `• ${q.taskTitle}: заявлено ${q.qtyDone}, прийнято ${q.qtyAccepted}${commentSuffix} (${q.checkedByName})`,
        )
      }
    }
    lines.push('')

    lines.push(`${tt('owner.section_comments')}:`)
    if (detail.comments.length === 0) {
      lines.push(`  ${tt('owner.section_comments_empty')}`)
    } else {
      for (const c of detail.comments) {
        lines.push(`• [${formatTime(c.createdAt)}] ${c.text}`)
      }
    }

    return lines.join('\n')
  }

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(buildLogText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Тихо ігноруємо — буфер обміну може бути недоступний (не https, дозволи).
    }
  }

  return (
    <main className={styles.main}>
      <button className={styles.back} onClick={() => router.push('/owner')}>
        {tt('shared.back_link')}
      </button>

      <div className={styles.bar}>{tt('owner.bar_template', { name: ownerName })}</div>
      <div className={styles.eyebrow}>{formatDate(detail.date)}</div>
      <h1 className={styles.h1}>{detail.responsibleName}</h1>

      <div className={`glass ${styles.headCard}`}>
        <div className={styles.headRow}>
          <span>
            {detail.openedAt ? tt('owner.row_open_template', { time: formatTime(detail.openedAt) }) : '—'}
          </span>
          <span>
            {detail.closedAt
              ? tt('owner.row_closed_template', { time: formatTime(detail.closedAt) })
              : tt('owner.row_still_open')}
          </span>
        </div>
        {detail.autoClosed && <div className={styles.autoNote}>{tt('owner.row_auto_closed')}</div>}
        {detail.handoverOk === false && (
          <div className={styles.handoverProblem}>
            {tt('owner.handover_problem')}
            {detail.handoverNote && `: ${detail.handoverNote}`}
          </div>
        )}
        <span className={styles[QUALITY_BADGE_CLASS[detail.qualityStatus]]}>
          {tt(QUALITY_BADGE_KEY[detail.qualityStatus])}
        </span>
      </div>

      <Section
        title={tt('owner.section_tasks')}
        summary={String(detail.tasks.length)}
        defaultOpen
      >
        {detail.tasks.length === 0 ? (
          <p className={styles.sectionEmpty}>{tt('owner.section_tasks_empty')}</p>
        ) : (
          detail.tasks.map((task) => (
            <div key={task.taskId} className={styles.taskRow}>
              <span className={styles.taskTitle}>
                {task.title}
                {task.taskType === 'rework' && <span className={styles.reworkTag}>{tt('owner.rework_tag')}</span>}
              </span>
              <span className={styles.taskQty}>
                {task.qtyDoneThisShift} <small>з {task.targetQty}</small>
              </span>
            </div>
          ))
        )}
      </Section>

      <Section title={tt('owner.section_gaps')} summary={String(detail.gapReasons.length)}>
        {detail.gapReasons.length === 0 ? (
          <p className={styles.sectionEmpty}>{tt('owner.section_gaps_empty')}</p>
        ) : (
          detail.gapReasons.map((gap, i) => (
            <div key={i} className={styles.textRow}>
              <b>{gap.taskTitle}:</b> {gap.text}
            </div>
          ))
        )}
      </Section>

      <Section title={tt('owner.section_quality')} summary={String(detail.qualityChecks.length)}>
        {detail.qualityChecks.length === 0 ? (
          <p className={styles.sectionEmpty}>{tt('owner.section_quality_empty')}</p>
        ) : (
          detail.qualityChecks.map((q, i) => (
            <div key={i} className={styles.textRow}>
              <b>{q.taskTitle}:</b> {q.qtyDone} → {q.qtyAccepted}
              {q.comment && <> — {q.comment}</>}
              <span className={styles.checkedBy}> ({q.checkedByName})</span>
            </div>
          ))
        )}
      </Section>

      <Section title={tt('owner.section_comments')} summary={String(detail.comments.length)}>
        {detail.comments.length === 0 ? (
          <p className={styles.sectionEmpty}>{tt('owner.section_comments_empty')}</p>
        ) : (
          detail.comments.map((c) => (
            <div key={c.id} className={styles.textRow}>
              <span className={styles.commentTime}>{formatTime(c.createdAt)}</span> {c.text}
            </div>
          ))
        )}
      </Section>

      <Section
        title={tt('owner.section_opening_checklist')}
        summary={detail.openingChecklist.completedAt ? '✓' : '—'}
      >
        {!detail.openingChecklist.completedAt ? (
          <p className={styles.sectionEmpty}>{tt('owner.checklist_not_completed')}</p>
        ) : (
          detail.openingChecklist.items.map((item) => (
            <div key={item.key} className={styles.checklistRow}>
              <span className={item.status === 'ok' ? styles.itemOk : styles.itemProblem}>
                {item.status === 'ok' ? '✓' : '⚠'}
              </span>
              <span className={styles.checklistText}>{item.text}</span>
            </div>
          ))
        )}
      </Section>

      <Section
        title={tt('owner.section_closing_checklist')}
        summary={detail.closingChecklist.completedAt ? '✓' : '—'}
      >
        {!detail.closingChecklist.completedAt ? (
          <p className={styles.sectionEmpty}>{tt('owner.checklist_not_completed')}</p>
        ) : (
          detail.closingChecklist.items.map((item) => (
            <div key={item.key} className={styles.checklistRow}>
              <span className={item.status === 'ok' ? styles.itemOk : styles.itemProblem}>
                {item.status === 'ok' ? '✓' : '⚠'}
              </span>
              <span className={styles.checklistText}>{item.text}</span>
            </div>
          ))
        )}
      </Section>

      <Section title={tt('owner.section_photos')} summary={String(detail.photos.length)}>
        {detail.photos.length === 0 ? (
          <p className={styles.sectionEmpty}>{tt('owner.section_photos_empty')}</p>
        ) : (
          <div className={styles.photoGrid}>
            {detail.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element -- авторизований проксі, не next/image-сумісний зовнішній хост
              <img
                key={photo.id}
                className={styles.photoThumb}
                src={`/api/app/media/${photo.id}`}
                alt={photo.alt}
                onClick={() => setLightbox(photo.id)}
              />
            ))}
          </div>
        )}
      </Section>

      <button className={`glass ${styles.copyBtn}`} onClick={copyLog}>
        {copied ? tt('owner.copy_log_done') : tt('owner.copy_log_button')}
      </button>

      {lightbox !== null && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- те саме, повноекранний перегляд */}
          <img className={styles.lightboxImg} src={`/api/app/media/${lightbox}`} alt="" />
        </div>
      )}
    </main>
  )
}
