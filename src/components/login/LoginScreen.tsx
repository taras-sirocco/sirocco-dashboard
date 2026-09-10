'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { t, type UiStringsMap } from '@/lib/uiStringsFormat'
import type { LoginWorker } from '@/lib/workers'

import styles from './LoginScreen.module.css'

type Step = 'people' | 'pin' | 'done'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function roleLabelKey(role: LoginWorker['role']): string {
  return role === 'foreman' ? 'login.role_foreman' : 'login.role_worker'
}

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

type LoginScreenProps = {
  workers: LoginWorker[]
  strings: UiStringsMap
}

export function LoginScreen({ workers, strings }: LoginScreenProps) {
  const router = useRouter()
  const tt = (key: string, vars?: Record<string, string>) => t(strings, key, vars)

  const [step, setStep] = useState<Step>('people')
  const [selected, setSelected] = useState<LoginWorker | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function pickWorker(worker: LoginWorker) {
    setSelected(worker)
    setPin('')
    setError('')
    setStep('pin')
  }

  function backToPeople() {
    setStep('people')
    setSelected(null)
    setPin('')
    setError('')
  }

  function pressDigit(digit: string) {
    if (submitting || pin.length >= 4) return
    const next = pin + digit
    setError('')
    setPin(next)
    if (next.length === 4) {
      // Невелика пауза, щоб було видно заповнену останню крапку — як у прототипі.
      setTimeout(() => submit(next), 150)
    }
  }

  function pressClear() {
    if (submitting) return
    setError('')
    setPin((p) => p.slice(0, -1))
  }

  // PIN звіряється лише тут — POST на BFF-роут. Клієнт ніколи не бачить
  // pinHash і не робить порівняння сам; сервер лише повертає ok/не ok.
  async function submit(value: string = pin) {
    if (!selected || submitting) return
    if (value.length < 4) {
      setError(tt('login.pin_incomplete'))
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/app/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: selected.id, pin: value }),
      })
      if (res.ok) {
        setStep('done')
        return
      }
      setError(tt('login.pin_wrong'))
      setShake(true)
      setTimeout(() => setShake(false), 340)
      setPin('')
    } catch {
      setError(tt('login.pin_wrong'))
    } finally {
      setSubmitting(false)
    }
  }

  // "Відкриваємо зміну…" — багатокрапка означає перехід далі сам собою.
  useEffect(() => {
    if (step !== 'done') return
    const timer = setTimeout(() => router.push('/opening'), 900)
    return () => clearTimeout(timer)
  }, [step, router])

  return (
    <main className={styles.main}>
      <section className={`${styles.step} ${step === 'people' ? styles.on : ''}`}>
        <h1 className={styles.h1}>{tt('login.title')}</h1>
        <div className={styles.people}>
          {workers.map((worker) => (
            <button
              key={worker.id}
              className={`glass ${styles.person}`}
              onClick={() => pickWorker(worker)}
            >
              <span className={`glass ${styles.ini}`}>{initials(worker.name)}</span>
              <span className={styles.pinfo}>
                <span className={styles.pname}>{worker.name}</span>
                <span className={styles.prole}>{tt(roleLabelKey(worker.role))}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={`${styles.step} ${step === 'pin' ? styles.on : ''}`}>
        {selected && (
          <div className={styles.pinwrap}>
            <div className={styles.who}>
              <span className={`glass ${styles.ini}`}>{initials(selected.name)}</span>
              <h2>{selected.name}</h2>
              <span className={styles.prole}>{tt(roleLabelKey(selected.role))}</span>
              <div className={`${styles.dots} ${shake ? styles.shake : ''}`}>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`${styles.pd} ${i < pin.length ? styles.f : ''}`} />
                ))}
              </div>
              <div className={styles.err}>{error}</div>
              <button className={`glass ${styles.ghost}`} onClick={backToPeople}>
                {tt('login.not_me')}
              </button>
            </div>
            <div className={styles.pad}>
              {DIGIT_KEYS.map((digit) => (
                <button
                  key={digit}
                  className={`glass ${styles.key}`}
                  onClick={() => pressDigit(digit)}
                >
                  {digit}
                </button>
              ))}
              <button
                className={`glass ${styles.key} ${styles.keySm}`}
                onClick={pressClear}
              >
                {tt('login.pin_clear')}
              </button>
              <button className={`glass ${styles.key}`} onClick={() => pressDigit('0')}>
                0
              </button>
              <button
                className={`glass ${styles.key} ${styles.keyGo}`}
                onClick={() => submit()}
              >
                {tt('login.pin_submit')}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={`${styles.step} ${step === 'done' ? styles.on : ''}`}>
        {selected && (
          <div className={styles.done}>
            <div className={`glass ${styles.ini}`}>{initials(selected.name)}</div>
            <h2>{tt('login.welcome', { name: selected.name.split(' ')[0] })}</h2>
            <p>{tt('login.opening_shift')}</p>
          </div>
        )}
      </section>
    </main>
  )
}
