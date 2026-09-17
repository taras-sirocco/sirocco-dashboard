import { redirect } from 'next/navigation'

import { Blobs } from '@/components/Blobs'
import { TopBar } from '@/components/TopBar'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getSessionWorker } from '@/utilities/getSessionWorker'
import { requireRole } from '@/utilities/requireRole'

export const dynamic = 'force-dynamic'

// Заглушка ЕТАПУ 0 — лише гейт і вхід перевіряються тут. Зведений звіт
// (список змін → деталь) приходить в ЕТАПІ 1 і замінить цей плейсхолдер.
export default async function OwnerPage() {
  const session = await getSessionWorker()
  if (!session) {
    redirect('/')
  }
  requireRole(session, ['owner'])

  const strings = await getUiStrings(['owner', 'shared'])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
        pendingSyncTemplate={t(strings, 'shared.pending_sync_template')}
      />
      <main style={{ flex: '1 1 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
          {t(strings, 'owner.placeholder_title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t(strings, 'owner.placeholder_sub')}</p>
      </main>
    </>
  )
}
