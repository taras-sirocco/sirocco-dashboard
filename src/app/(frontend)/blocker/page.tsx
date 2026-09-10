import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { TopBar } from '@/components/TopBar'
import { BlockerScreen } from '@/components/blocker/BlockerScreen'
import { getTodayShift } from '@/lib/shifts'
import { getTodayTasksWithProgress } from '@/lib/tasks'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function BlockerPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const shift = await getTodayShift()
  if (!shift?.openedAt) {
    redirect('/opening')
  }

  const tasks = await getTodayTasksWithProgress()
  const gaps = tasks.filter((task) => task.done < task.targetQty)

  // Немає недобору — нема чого питати, одразу до аркуша дня.
  if (gaps.length === 0) {
    redirect('/close')
  }

  const strings = await getUiStrings(['blocker', 'shared'])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <BlockerScreen strings={strings} workerName={session.name} gaps={gaps} />
    </>
  )
}
