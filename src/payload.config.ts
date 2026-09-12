import { postgresAdapter } from '@payloadcms/db-postgres'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { StepMedia } from './collections/StepMedia'
import { stepMediaAdapter } from './lib/stepMediaAdapter'
import { Workers } from './collections/Workers'
import { Shifts } from './collections/Shifts'
import { ChecklistTemplates } from './collections/ChecklistTemplates'
import { ChecklistRuns } from './collections/ChecklistRuns'
import { ChecklistAnswers } from './collections/ChecklistAnswers'
import { Tasks } from './collections/Tasks'
import { TaskProgress } from './collections/TaskProgress'
import { Blockers } from './collections/Blockers'
import { Comments } from './collections/Comments'
import { ChangesLog } from './collections/ChangesLog'
import { Broadcasts } from './collections/Broadcasts'
import { BroadcastAcks } from './collections/BroadcastAcks'
import { UiStrings } from './collections/UiStrings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    StepMedia,
    Workers,
    Shifts,
    ChecklistTemplates,
    ChecklistRuns,
    ChecklistAnswers,
    Tasks,
    TaskProgress,
    Blockers,
    Comments,
    ChangesLog,
    Broadcasts,
    BroadcastAcks,
    UiStrings,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  // @payloadcms/storage-vercel-blob прибрано: він уміє вантажити лише з
  // access:'public', а наше сховище (sirocco-dashboard-blob) — приватне.
  // Байти йдуть напряму через @vercel/blob (src/lib/mediaStorage.ts),
  // Media зберігає лише метадані.
  //
  // StepMedia — інакший випадок: адмін завантажує файл через ЗВИЧАЙНУ
  // Payload-форму (без нашого BFF), тому їй потрібен справжній storage
  // adapter — власний, під те саме приватне сховище (src/lib/stepMediaAdapter.ts).
  plugins: [
    cloudStoragePlugin({
      collections: {
        stepMedia: {
          adapter: stepMediaAdapter,
        },
      },
    }),
  ],
})
