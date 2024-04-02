import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { proxy, ref } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { QUERY_PARAM_DOC } from '../env'
import { freshTLStore, getUrl, updateUrlBar } from '../utils'
import { GlobalStateContext } from './context'
import { connectYSweet, initSync } from './sync'
import { GlobalState } from './types'

export function GlobalStateProvider({ children }: React.PropsWithChildren) {
  const state: GlobalState = useRef(
    proxy({
      active: { tlstore: ref(freshTLStore()) },
      func: { connect: () => connectYSweet(state), toast },
    }),
  ).current

  // NOTE: expect the connection & toasts to be repeated twice.
  // See: https://react.dev/blog/2022/03/29/react-v18#new-strict-mode-behaviors
  // Doesn't happen in production builds.
  useEffect(() => {
    state.docId = getUrl().searchParams.get(QUERY_PARAM_DOC) ?? undefined
    const unsub1 = subscribeKey(state, 'docId', updateUrlBar)
    const unsub2 = initSync(state)
    if (state.docId) state.func.connect()
    return () => {
      unsub1()
      unsub2()
    }
  }, [state])

  return (
    <GlobalStateContext.Provider value={state}>
      {children}
    </GlobalStateContext.Provider>
  )
}
