import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { ShiftStatusBar } from '@/components/ShiftStatusBar'
import { ClosingChecklistScreen } from '@/components/close/ClosingChecklistScreen'
import { getClosingChecklistState } from '@/lib/closingChecklist'
import { getTodayShift } from '@/lib/shifts'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function ClosingChecklistPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const [strings, items] = await Promise.all([
    getUiStrings(['close', 'shared']),
    getClosingChecklistState(),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <ShiftStatusBar strings={strings} name={session.name} />
      <ClosingChecklistScreen strings={strings} workerName={session.name} initialItems={items} />
      <BroadcastGate />
    </>
  )
}
