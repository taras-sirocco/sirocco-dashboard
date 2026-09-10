import type { UiStringsMap } from '@/lib/uiStringsFormat'

import styles from './ShiftStatusBar.module.css'

type ShiftStatusBarProps = {
  strings: UiStringsMap
  name: string
}

/** Рядок статусу під шапкою — на всіх екранах зміни після відкриття. */
export function ShiftStatusBar({ strings, name }: ShiftStatusBarProps) {
  const template = strings['shared.shift_status_bar'] ?? 'shared.shift_status_bar'
  const [before, after] = template.split('{name}')

  return (
    <div className={styles.bar}>
      {before}
      <b>{name}</b>
      {after}
    </div>
  )
}
