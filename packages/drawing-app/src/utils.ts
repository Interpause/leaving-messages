import { useReducer } from 'react'
import { TLStoreWithStatus, createTLStore, defaultShapeUtils } from 'tldraw'

export const getUrl = () => new URL(window.location.href)

export const freshTLStore = () =>
  ({
    status: 'not-synced',
    store: createTLStore({ shapeUtils: [...defaultShapeUtils] }),
  }) as TLStoreWithStatus

export const useUpdate = () => useReducer((x) => x + 1, 0)[1]
