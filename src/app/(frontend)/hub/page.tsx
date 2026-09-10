import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { HubScreen } from '@/components/hub/HubScreen'
import { getChangesLog } from '@/lib/changesLog'
import { getTodayShift } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const [strings, tasks, changes] = await Promise.all([
    getUiStrings(['hub', 'shared', 'task']),
    getTodayTasksWithProgress(),
    getChangesLog(),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <HubScreen strings={strings} workerName={session.name} tasks={tasks} changes={changes} />
      <BroadcastGate />
    </>
  )
}
