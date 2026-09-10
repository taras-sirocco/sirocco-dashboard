import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { BroadcastGate } from '@/components/BroadcastGate'
import { TopBar } from '@/components/TopBar'
import { OpeningScreen } from '@/components/opening/OpeningScreen'
import { getChecklistTemplate } from '@/lib/checklistTemplates'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function OpeningPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const [strings, template] = await Promise.all([
    getUiStrings(['opening', 'shared']),
    getChecklistTemplate('opening'),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <OpeningScreen strings={strings} workerName={session.name} items={template?.items ?? []} />
      <BroadcastGate />
    </>
  )
}
