import { ClientToken } from '@y-sweet/sdk'
import toast from 'react-hot-toast'
import { TLStoreWithStatus } from 'tldraw'
import { proxy, ref, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { QUERY_PARAM_DOC } from './env'
import { connectYSweet, initSync } from './sync'
import { freshTLStore, getUrl } from './utils'

export interface Callbacks {
  connect: () => Promise<void>
  toast: typeof toast
}

export interface ActiveState {
  token?: ClientToken
  docId?: string
  tlstore: TLStoreWithStatus
  cleanPrev?: () => void
}

export interface GlobalState {
  docId?: string
  active: ActiveState
  func: Callbacks
}

export const globalState: GlobalState = proxy({
  active: { tlstore: ref(freshTLStore()) },
  func: { connect: () => connectYSweet(globalState), toast },
})

export function initState() {
  subscribeKey(globalState, 'docId', (docId) => {
    const url = getUrl()
    const oldId = url.searchParams.get(QUERY_PARAM_DOC) ?? undefined

    if (oldId === docId) return

    if (!docId) url.searchParams.delete(QUERY_PARAM_DOC)
    else url.searchParams.set(QUERY_PARAM_DOC, docId)

    window.history.replaceState({}, '', url.toString())
  })

  globalState.docId = getUrl().searchParams.get(QUERY_PARAM_DOC) ?? undefined

  initSync(globalState)
}

export const useGlobalState = () =>
  [useSnapshot(globalState), globalState] as const
