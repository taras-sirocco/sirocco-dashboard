import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { DailySheetScreen } from '@/components/close/DailySheetScreen'
import { getTodayComments } from '@/lib/comments'
import { getTodayShift } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'
import { requireRole } from '@/utilities/requireRole'

export const dynamic = 'force-dynamic'

export default async function DailySheetPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }
  requireRole(session, ['worker'])

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const [strings, tasks, comments] = await Promise.all([
    getUiStrings(['close', 'shared']),
    getTodayTasksWithProgress(),
    getTodayComments(),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
        pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
      />
      <DailySheetScreen strings={strings} workerName={session.name} tasks={tasks} comments={comments} />
      <BroadcastGate />
    </>
  )
}
