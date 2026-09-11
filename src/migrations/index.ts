import * as migration_20260910_211738_initial_schema from './20260910_211738_initial_schema';
import * as migration_20260911_094837_add_media_blob_pathname from './20260911_094837_add_media_blob_pathname';
import * as migration_20260911_200153_add_shift_autoclosed from './20260911_200153_add_shift_autoclosed';

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
    name: '20260911_200153_add_shift_autoclosed'
  },
];
