'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { ClosingChecklistItem } from '@/lib/closingChecklist'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'
import { submitForm, submitJson } from '@/offline/submit'

import styles from './ClosingChecklistScreen.module.css'

type View = 'checklist' | 'confirm' | 'done' | 'idle'

type ClosingChecklistScreenProps = {
  strings: UiStringsMap
  workerName: string
  initialItems: ClosingChecklistItem[]
}

export function ClosingChecklistScreen({ strings, workerName, initialItems }: ClosingChecklistScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [view, setView] = useState<View>('checklist')
  const [items, setItems] = useState(initialItems)
  // Локальні прев'ю фото, ще не синхронізованих (photoId === PENDING_PHOTO_ID) — блоб з камери,
  // не з проксі-роуту, бо на сервері їх ще нема.
  const [pendingPhotos, setPendingPhotos] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [closedAt, setClosedAt] = useState('')
  const camTarget = useRef<string | null>(null)
  const camInput = useRef<HTMLInputElement>(null)

  const PENDING_PHOTO_ID = -1

  const allDone = items.every((item) => item.status === 'ok' && (!item.requiresPhoto || item.photoId))

  async function answer(key: string, status: 'ok' | 'problem') {
    const previousItems = items
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, status } : i)))
    const result = await submitJson('/api/app/checklist/closing-answer', 'checklist-closing-answer', {
      itemKey: key,
      status,
    })
    if (!result.ok) {
      setItems(previousItems)
      setError(tt('close.answer_save_failed'))
    }
  }

  function tapItem(item: ClosingChecklistItem) {
    if (item.requiresPhoto && !item.photoId) {
      camTarget.current = item.key
      camInput.current?.click()
      return
    }
    void answer(item.key, item.status === 'ok' ? 'problem' : 'ok')
  }

  async function onPhotoChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const key = camTarget.current
    e.target.value = ''
    camTarget.current = null
    if (!file || !key) return

    const previousItems = items
    const previewUrl = URL.createObjectURL(file)
    setPendingPhotos((prev) => ({ ...prev, [key]: previewUrl }))
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, status: 'ok', photoId: PENDING_PHOTO_ID } : i)))
    setError('')

    const result = await submitForm(
      '/api/app/checklist/closing-answer',
      'checklist-closing-photo',
      { itemKey: key, status: 'ok' },
      { blob: file, fieldName: 'photo', fileName: file.name || `photo-${Date.now()}.jpg` },
    )

    if (!result.ok) {
      setItems(previousItems)
      setPendingPhotos((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setError(tt('close.photo_upload_failed'))
      return
    }

    if (!result.queued) {
      const data = result.data as { mediaId?: number } | null
      const mediaId = data?.mediaId
      if (typeof mediaId === 'number') {
        setItems((prev) => prev.map((i) => (i.key === key ? { ...i, photoId: mediaId } : i)))
      }
    }
    // Якщо queued — лишаємо PENDING_PHOTO_ID + локальний прев'ю: синхронізується фоном.
  }

  async function confirmClose() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/app/shifts/close', { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { closedAt: string }
        setClosedAt(data.closedAt)
        setView('done')
      } else {
        setError(tt('close.checklist_incomplete_error'))
        setView('checklist')
      }
    } catch {
      // Закриття зміни — єдина дія тут, що НЕ йде в офлайн-чергу: це
      // фінальний, авторитетний момент, його свідомо не відкладаємо.
      setError(tt('close.confirm_needs_network'))
      setView('checklist')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (view !== 'done') return
    const timer = setTimeout(() => setView('idle'), 10_000)
    return () => clearTimeout(timer)
  }, [view])

  const closedTime = closedAt
    ? new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(closedAt))
    : ''

  return (
    <main className={styles.main}>
      <input
        ref={camInput}
        className={styles.hiddenInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoChosen}
      />

      <section className={`${styles.view} ${view === 'checklist' ? styles.on : ''}`}>
        <div className={styles.eyebrow}>{tt('close.checklist_eyebrow')}</div>
        <h1 className={styles.h1}>{tt('close.checklist_title')}</h1>
        <p className={styles.sub}>{error || tt('close.checklist_sub')}</p>

        <div className={styles.clist}>
          {items.map((item) => (
            <div key={item.key}>
              <div
                className={`glass ${styles.citem} ${item.status === 'ok' ? styles.on : ''} ${
                  item.requiresPhoto && item.photoId ? styles.shotDone : ''
                }`}
                onClick={() => tapItem(item)}
              >
                <span className={styles.chk}>✓</span>
                <span style={{ flex: 1 }}>{item.text}</span>
                {item.requiresPhoto && (
                  <span className={styles.ph}>{item.photoId ? tt('close.photo_present') : tt('close.photo_required')}</span>
                )}
              </div>
              {item.requiresPhoto && item.photoId && (
                <div className={styles.photostrip}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- авторизований проксі (або локальний прев'ю, поки не синхронізовано) */}
                  <img
                    className={styles.thumb}
                    src={item.photoId > 0 ? `/api/app/media/${item.photoId}` : pendingPhotos[item.key]}
                    alt=""
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button className={`glass ${styles.big} ${styles.primary}`} disabled={!allDone} onClick={() => setView('confirm')}>
          {tt('close.checklist_submit')}
        </button>
      </section>

      <section className={`${styles.view} ${view === 'confirm' ? styles.on : ''}`}>
        <div className={styles.eyebrow}>{tt('close.confirm_eyebrow')}</div>
        <h1 className={styles.h1}>{tt('close.confirm_title')}</h1>
        <p
          className={styles.sub}
          // eslint-disable-next-line react/no-danger -- текст з uiStrings (адмінка), містить <br>
          dangerouslySetInnerHTML={{
            __html: tt('close.confirm_sub', {
              name: workerName,
              time: new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date()),
            }),
          }}
        />
        <div className={`glass ${styles.note}`}>{tt('close.confirm_note')}</div>
        <button className={`glass ${styles.big} ${styles.primary}`} disabled={busy} onClick={confirmClose}>
          {tt('close.confirm_button')}
        </button>
        <button className={`glass ${styles.big} ${styles.ghost}`} onClick={() => setView('checklist')}>
          {tt('close.confirm_back')}
        </button>
      </section>

      <section className={`${styles.view} ${view === 'done' ? styles.on : ''}`}>
        <div className={styles.fin}>
          <div className={styles.finIc}>✓</div>
          <h1 className={styles.h1}>{tt('close.done_title')}</h1>
          <p>{tt('close.done_sub_template', { time: closedTime })}</p>
        </div>
      </section>

      <section className={`${styles.view} ${view === 'idle' ? styles.on : ''}`}>
        <div className={styles.idlewrap}>
          {/* eslint-disable-next-line @next/next/no-img-element -- статичний файл з /public */}
          <img className={styles.idlelogo} src="/logo.svg" alt="Sirocco Energy" />
        </div>
      </section>

      {view === 'idle' && <div className={styles.idletap} onClick={() => router.push('/')} />}
    </main>
  )
}
