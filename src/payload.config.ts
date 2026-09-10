import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
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
  plugins: [],
})
