'use client'

import styles from './NoteField.module.css'

type NoteFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** Текстове поле нотатки (без запису голосу). */
export function NoteField({ value, onChange, placeholder }: NoteFieldProps) {
  return (
    <div className={`glass ${styles.wrap}`}>
      <textarea
        className={styles.textarea}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
