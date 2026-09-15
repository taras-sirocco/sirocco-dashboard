import * as migration_20260910_211738_initial_schema from './20260910_211738_initial_schema';
import * as migration_20260911_094837_add_media_blob_pathname from './20260911_094837_add_media_blob_pathname';
import * as migration_20260911_200153_add_shift_autoclosed from './20260911_200153_add_shift_autoclosed';
import * as migration_20260912_052620_add_step_media from './20260912_052620_add_step_media';
import * as migration_20260914_113807_add_task_description from './20260914_113807_add_task_description';
import * as migration_20260915_194709_add_task_completed_at from './20260915_194709_add_task_completed_at';

export const migrations = [
  {
    up: migration_20260910_211738_initial_schema.up,
    down: migration_20260910_211738_initial_schema.down,
    name: '20260910_211738_initial_schema',
  },
  {
    up: migration_20260911_094837_add_media_blob_pathname.up,
    down: migration_20260911_094837_add_media_blob_pathname.down,
    name: '20260911_094837_add_media_blob_pathname',
  },
  {
    up: migration_20260911_200153_add_shift_autoclosed.up,
    down: migration_20260911_200153_add_shift_autoclosed.down,
    name: '20260911_200153_add_shift_autoclosed',
  },
  {
    up: migration_20260912_052620_add_step_media.up,
    down: migration_20260912_052620_add_step_media.down,
    name: '20260912_052620_add_step_media',
  },
  {
    up: migration_20260914_113807_add_task_description.up,
    down: migration_20260914_113807_add_task_description.down,
    name: '20260914_113807_add_task_description',
  },
  {
    up: migration_20260915_194709_add_task_completed_at.up,
    down: migration_20260915_194709_add_task_completed_at.down,
    name: '20260915_194709_add_task_completed_at'
  },
];
