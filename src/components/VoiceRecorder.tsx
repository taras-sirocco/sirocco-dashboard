'use client'

import { useRef, useState } from 'react'

import styles from './VoiceRecorder.module.css'

type VoiceRecorderProps = {
  value: string
  onChange: (value: string) => void
  idleHint: string
  recordingHint: string
  unavailableHint: string
  placeholder: string
  micAriaLabel: string
  critical?: boolean
  /** Викликається, коли запис зупинено — щоб батьківський екран знав, що є аудіо, навіть як текст порожній. */
  onRecordingStop?: () => void
}

/**
 * Тільки UX запису (MediaRecorder) — жодних рішень тут. Сам блоб поки не
 * вивантажується нікуди: реальне завантаження аудіо й транскрипція Whisper
 * заплановані на офлайн-синхронізацію (окремий крок), не на цей екран.
 */
export function VoiceRecorder({
  value,
  onChange,
  idleHint,
  recordingHint,
  unavailableHint,
  placeholder,
  micAriaLabel,
  critical,
  onRecordingStop,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [hint, setHint] = useState(idleHint)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.start()
      recorderRef.current = recorder
      startRef.current = Date.now()
      setRecording(true)
      setHint(recordingHint)
      timerRef.current = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
      }, 300)
    } catch {
      setHint(unavailableHint)
    }
  }

  function stop() {
    const recorder = recorderRef.current
    if (recorder && recorder.state === 'recording') {
      recorder.stop()
      recorder.stream.getTracks().forEach((track) => track.stop())
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
    setSeconds(0)
    setHint(idleHint)
    if (recorder) onRecordingStop?.()
  }

  function toggle() {
    if (recording) stop()
    else void start()
  }

  const mm = Math.floor(seconds / 60)
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className={`glass ${styles.wrap}`}>
      <div className={styles.wrap} style={{ position: 'relative', zIndex: 1 }}>
        <button
          type="button"
          className={`${styles.mic} ${recording ? styles.on : ''} ${critical ? styles.critical : ''}`}
          aria-label={micAriaLabel}
          onClick={toggle}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v4" />
          </svg>
        </button>
        {recording && (
          <div className={styles.rectime}>
            {mm}:{ss}
          </div>
        )}
        <div className={styles.rechint}>{hint}</div>
        <textarea
          className={styles.textarea}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
