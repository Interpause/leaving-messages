import { ClientToken } from '@y-sweet/sdk'
import { createContext, useContext, useEffect, useRef } from 'react'
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

const GlobalStateContext = createContext<GlobalState>(
  null as unknown as GlobalState,
)

export function GlobalStateProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const state: GlobalState = useRef(
    proxy({
      active: { tlstore: ref(freshTLStore()) },
      func: { connect: () => connectYSweet(state), toast },
    }),
  ).current

  useEffect(() => {
    subscribeKey(state, 'docId', (docId) => {
      const url = getUrl()
      const oldId = url.searchParams.get(QUERY_PARAM_DOC) ?? undefined

      if (oldId === docId) return

      if (!docId) url.searchParams.delete(QUERY_PARAM_DOC)
      else url.searchParams.set(QUERY_PARAM_DOC, docId)

      window.history.replaceState({}, '', url.toString())
    })

    state.docId = getUrl().searchParams.get(QUERY_PARAM_DOC) ?? undefined

    initSync(state)
  }, [state])
  return (
    <GlobalStateContext.Provider value={state}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export const useGlobalState = () => {
  const state = useContext(GlobalStateContext)
  return [useSnapshot(state), state] as const
}
