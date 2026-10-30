import * as migration_20261030_183414_initial from './20261030_183414_initial';

export const migrations = [
  {
    up: migration_20261030_183414_initial.up,
    down: migration_20261030_183414_initial.down,
    name: '20261030_183414_initial'
  },
];
