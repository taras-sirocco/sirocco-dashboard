'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import type { ClosingChecklistItem } from '@/lib/closingChecklist'
import { t, type UiStringsMap } from '@/lib/uiStringsFormat'

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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [closedAt, setClosedAt] = useState('')
  const camTarget = useRef<string | null>(null)
  const camInput = useRef<HTMLInputElement>(null)

  const allDone = items.every((item) => item.status === 'ok' && (!item.requiresPhoto || item.photoId))

  async function answer(key: string, status: 'ok' | 'problem', mediaId?: number) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, status, photoId: mediaId ?? i.photoId } : i)))
    await fetch('/api/app/checklist/closing-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemKey: key, status, mediaId }),
    })
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

    const form = new FormData()
    form.append('file', file)
    form.append('source', 'closing_checklist')
    const res = await fetch('/api/app/media', { method: 'POST', body: form })
    if (!res.ok) return
    const { id } = (await res.json()) as { id: number }
    await answer(key, 'ok', id)
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
                  {/* eslint-disable-next-line @next/next/no-img-element -- авторизований проксі, не Next Image loader */}
                  <img className={styles.thumb} src={`/api/app/media/${item.photoId}`} alt="" />
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
          <div className={styles.idlelogo}>SIROCCO</div>
        </div>
      </section>

      {view === 'idle' && <div className={styles.idletap} onClick={() => router.push('/')} />}
    </main>
  )
}
