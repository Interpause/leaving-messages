import { createTLSchema, createTLStore } from 'tldraw'

export const getUrl = () => new URL(window.location.href)

export const createEmptySnapshot = () => ({
  store: createTLStore({}).serialize(),
  schema: createTLSchema().serialize(),
})
