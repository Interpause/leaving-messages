import { proxy, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { getUrl } from './utils'

const QUERY_PARAM_DOC = 'doc'

export interface globalState {
  docId: string | null
}

export const globalState = proxy<globalState>({
  docId: null,
})

export function initState() {
  subscribeKey(globalState, 'docId', (docId) => {
    const url = getUrl()
    const oldId = url.searchParams.get(QUERY_PARAM_DOC)

    if (oldId == docId) return

    if (!docId) url.searchParams.delete(QUERY_PARAM_DOC)
    else url.searchParams.set(QUERY_PARAM_DOC, docId)

    window.history.replaceState({}, '', url.toString())
  })

  globalState.docId = getUrl().searchParams.get(QUERY_PARAM_DOC)
}

export const useGlobalState = () =>
  [useSnapshot(globalState), globalState] as const
