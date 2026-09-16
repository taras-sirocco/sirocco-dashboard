import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { TopBar } from '@/components/TopBar'
import { QualityListScreen } from '@/components/quality/QualityListScreen'
import { QualityCheckScreen } from '@/components/quality/QualityCheckScreen'
import { getQualityCheckList, getShiftQualityDetail } from '@/lib/qualityChecks'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'

export const dynamic = 'force-dynamic'

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<{ shiftId?: string }>
}) {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }
  // Дзеркальний гейт до тих, що на екранах монтажника: сюди заходить лише
  // бригадир, навіть якщо монтажник підставить URL вручну.
  if (session.role !== 'foreman') {
    redirect('/tasks')
  }

  const strings = await getUiStrings(['quality', 'shared'])
  const { shiftId: shiftIdParam } = await searchParams
  const shiftId = Number(shiftIdParam)

  if (Number.isInteger(shiftId)) {
    const detail = await getShiftQualityDetail(shiftId)
    if (!detail) {
      redirect('/quality')
    }
    return (
      <>
        <Blobs />
        <TopBar
          onlineLabel={t(strings, 'shared.network_online')}
          offlineLabel={t(strings, 'shared.network_offline')}
          pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
        />
        <QualityCheckScreen strings={strings} foremanName={session.name} detail={detail} />
      </>
    )
  }

  const list = await getQualityCheckList()

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
        pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
      />
      <QualityListScreen strings={strings} foremanName={session.name} shifts={list} />
    </>
  )
}
