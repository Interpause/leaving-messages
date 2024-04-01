import { ClientToken } from '@y-sweet/sdk'
import { createContext, useContext, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { TLStoreWithStatus } from 'tldraw'
import { proxy, ref, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { QUERY_PARAM_DOC } from './env'
import { connectYSweet, initSync } from './sync'
import { freshTLStore, getUrl, updateUrlBar } from './utils'

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

const GlobalStateContext = createContext<GlobalState | null>(null)

export function GlobalStateProvider({ children }: React.PropsWithChildren) {
  const state: GlobalState = useRef(
    proxy({
      active: { tlstore: ref(freshTLStore()) },
      func: { connect: () => connectYSweet(state), toast },
    }),
  ).current

  useEffect(() => {
    state.docId = getUrl().searchParams.get(QUERY_PARAM_DOC) ?? undefined
    subscribeKey(state, 'docId', updateUrlBar)
    initSync(state)
    if (state.docId) state.func.connect()
  }, [state])

  return (
    <GlobalStateContext.Provider value={state}>
      {children}
    </GlobalStateContext.Provider>
  )
}

export const useGlobalState = () => {
  const state = useContext(GlobalStateContext)
  if (!state) throw new Error('useGlobalState missing context.')
  return [useSnapshot(state), state] as const
}
