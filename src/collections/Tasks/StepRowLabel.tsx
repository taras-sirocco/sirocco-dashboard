'use client'

import { useRowLabel } from '@payloadcms/ui'

type StepRow = {
  title?: string
}

export function StepRowLabel() {
  const { data, rowNumber } = useRowLabel<StepRow>()
  const n = String(rowNumber ?? 1).padStart(2, '0')
  return <div>{`Крок ${n}${data?.title ? ` — ${data.title}` : ''}`}</div>
}
