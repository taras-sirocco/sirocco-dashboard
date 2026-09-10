import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { TopBar } from '@/components/TopBar'
import { ReportScreen } from '@/components/report/ReportScreen'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>
}) {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }

  const { kind: kindParam } = await searchParams
  const kind = kindParam === 'critical' ? 'critical' : 'note'

  const strings = await getUiStrings(['hub', 'shared'])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <ReportScreen kind={kind} strings={strings} />
    </>
  )
}
