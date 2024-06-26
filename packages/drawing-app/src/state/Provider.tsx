import { useLayoutEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { proxy, ref } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { QUERY_PARAM_DOC } from '../env'
import { freshTLStore, getUrl, updateUrlBar } from '../utils'
import { GlobalStateContext } from './context'
import { connectYSweet, initSync } from './sync'
import { GlobalState } from './types'

export interface GlobalStateProviderProps extends React.PropsWithChildren {
  docId?: string
  isMain?: boolean
  onLocalChange?: () => void
  onRemoteChange?: () => void
}

export function GlobalStateProvider({
  docId,
  isMain,
  onLocalChange,
  onRemoteChange,
  children,
}: GlobalStateProviderProps) {
  const state: GlobalState = useRef(
    proxy({
      active: { tlstore: ref(freshTLStore()), numUsers: 0 },
      func: { connect: () => connectYSweet(state), toast },
    }),
  ).current

  // NOTE: expect the connection & toasts to be repeated twice.
  // See: https://react.dev/blog/2022/03/29/react-v18#new-strict-mode-behaviors
  // Doesn't happen in production builds.
  useLayoutEffect(() => {
    let unsub1 = () => {}
    if (isMain) {
      state.docId = getUrl().searchParams.get(QUERY_PARAM_DOC) ?? docId
      unsub1 = subscribeKey(state, 'docId', updateUrlBar)
    } else {
      if (docId === undefined)
        throw new Error('docId is required if not isMain!')
      state.docId = docId
      state.func.toast = undefined
    }
    const unsub2 = initSync(state)
    if (state.docId) state.func.connect()
    return () => {
      unsub1()
      unsub2()
    }
  }, [state, docId, isMain])

  useLayoutEffect(() => {
    state.func.onLocalChange = onLocalChange
  }, [state.func, onLocalChange])

  useLayoutEffect(() => {
    state.func.onRemoteChange = onRemoteChange
  }, [state.func, onRemoteChange])

  return (
    <GlobalStateContext.Provider value={state}>
      {children}
    </GlobalStateContext.Provider>
  )
}
