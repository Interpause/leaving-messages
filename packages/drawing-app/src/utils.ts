import { useReducer } from 'react'
import { TLStoreWithStatus, createTLStore, defaultShapeUtils } from 'tldraw'
import { QUERY_PARAM_DOC } from './env'

export const getUrl = () => new URL(window.location.href)

export const freshTLStore = () =>
  ({
    status: 'not-synced',
    store: createTLStore({ shapeUtils: defaultShapeUtils }),
  }) as TLStoreWithStatus

export const useUpdate = () => useReducer((x) => x + 1, 0)[1]

export const updateUrlBar = (docId?: string) => {
  const url = getUrl()
  const oldId = url.searchParams.get(QUERY_PARAM_DOC) ?? undefined
  if (oldId === docId) return
  if (!docId) url.searchParams.delete(QUERY_PARAM_DOC)
  else url.searchParams.set(QUERY_PARAM_DOC, docId)
  window.history.replaceState({}, '', url.toString())
}

export const toggleEruda = () => {
  const url = getUrl()
  const eruda = url.searchParams.get('eruda')
  if (eruda === null) url.searchParams.set('eruda', 'true')
  else url.searchParams.delete('eruda')
  window.history.replaceState({}, '', url.toString())
  window.location.reload()
}
