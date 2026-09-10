import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { StepsScreen } from '@/components/steps/StepsScreen'
import { getTaskWithSteps } from '@/lib/taskSteps'
import { getTodayShift } from '@/lib/shifts'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function StepsPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>
}) {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const { taskId: taskIdParam } = await searchParams
  const taskId = Number(taskIdParam)
  const task = Number.isInteger(taskId) ? await getTaskWithSteps(taskId) : null
  if (!task) {
    redirect('/tasks')
  }

  const strings = await getUiStrings(['steps', 'shared'])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <StepsScreen strings={strings} workerName={session.name} task={task} />
      <BroadcastGate />
    </>
  )
}
