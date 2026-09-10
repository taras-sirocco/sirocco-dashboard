import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { TaskScreen } from '@/components/tasks/TaskScreen'
import { getTodayShift } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const [strings, tasks] = await Promise.all([
    getUiStrings(['task', 'shared', 'close']),
    getTodayTasksWithProgress(),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <TaskScreen strings={strings} workerName={session.name} tasks={tasks} />
      <BroadcastGate />
    </>
  )
}
