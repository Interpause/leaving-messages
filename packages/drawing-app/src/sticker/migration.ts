import { defineMigrations } from 'tldraw'

export const stickerShapeMigrations = defineMigrations({
  currentVersion: 1,
  migrators: {
    1: {
      up(shape) {
        const migratedUpShape = { ...shape }
        return migratedUpShape
      },
      down(shape) {
        const migratedDownShape = { ...shape }
        return migratedDownShape
      },
    },
  },
})
