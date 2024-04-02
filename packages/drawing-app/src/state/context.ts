import { createContext, useContext } from 'react'
import { useSnapshot } from 'valtio'
import { GlobalState } from './types'

export const GlobalStateContext = createContext<GlobalState | null>(null)

export const useGlobalState = () => {
  const state = useContext(GlobalStateContext)
  if (!state) throw new Error('useGlobalState missing context.')
  return [useSnapshot(state), state] as const
}
