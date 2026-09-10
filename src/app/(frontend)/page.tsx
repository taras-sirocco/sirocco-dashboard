import { Blobs } from '@/components/Blobs'
import { TopBar } from '@/components/TopBar'
import { LoginScreen } from '@/components/login/LoginScreen'
import { getUiStrings, t } from '@/lib/uiStrings'
import { getActiveWorkers } from '@/lib/workers'

// Список працівників і uiStrings редагуються в адмінці в будь-який момент —
// сторінка не має запікатись у статичний білд.
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const [strings, workers] = await Promise.all([
    getUiStrings(['login', 'shared']),
    getActiveWorkers(),
  ])

  return (
    <>
      <Blobs />
      <TopBar
        onlineLabel={t(strings, 'shared.network_online')}
        offlineLabel={t(strings, 'shared.network_offline')}
      />
      <LoginScreen workers={workers} strings={strings} />
    </>
  )
}
