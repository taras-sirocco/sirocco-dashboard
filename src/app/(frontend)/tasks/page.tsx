import { redirect } from 'next/navigation'

import { AutoRefresh } from '@/components/AutoRefresh'
import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { TaskScreen } from '@/components/tasks/TaskScreen'
import { getTodayShift } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'
import { requireRole } from '@/utilities/requireRole'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }
  requireRole(session, ['worker'])

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const [strings, tasks] = await Promise.all([
    getUiStrings(['task', 'shared', 'close', 'hub']),
    getTodayTasksWithProgress(),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
        pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
      />
      <TaskScreen strings={strings} workerName={session.name} tasks={tasks} />
      <BroadcastGate />
      <AutoRefresh />
    </>
  )
}
