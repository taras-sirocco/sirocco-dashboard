import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { TopBar } from '@/components/TopBar'
import { OwnerShiftListScreen } from '@/components/owner/OwnerShiftListScreen'
import { OwnerShiftReportScreen } from '@/components/owner/OwnerShiftReportScreen'
import { getOwnerShiftList, getOwnerShiftDetail } from '@/lib/ownerReport'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'
import { requireRole } from '@/utilities/requireRole'

export const dynamic = 'force-dynamic'

// Той самий каркас, що й /quality: ?shiftId= — деталь, без нього — список.
export default async function OwnerPage({
  searchParams,
}: {
  searchParams: Promise<{ shiftId?: string }>
}) {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }
  requireRole(session, ['owner'])

  const strings = await getUiStrings(['owner', 'shared'])
  const { shiftId: shiftIdParam } = await searchParams
  const shiftId = Number(shiftIdParam)

  if (Number.isInteger(shiftId)) {
    const detail = await getOwnerShiftDetail(shiftId)
    if (!detail) {
      redirect('/owner')
    }
    return (
      <>
        <Blobs />
        <TopBar
          onlineLabel={t(strings, 'shared.network_online')}
          offlineLabel={t(strings, 'shared.network_offline')}
          pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
        />
        <OwnerShiftReportScreen strings={strings} ownerName={session.name} detail={detail} />
      </>
    )
  }

  const shifts = await getOwnerShiftList()

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
        pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
      />
      <OwnerShiftListScreen strings={strings} ownerName={session.name} shifts={shifts} />
    </>
  )
}
