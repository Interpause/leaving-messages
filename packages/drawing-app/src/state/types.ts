import { ClientToken } from '@y-sweet/sdk'
import toast from 'react-hot-toast'
import { TLStoreWithStatus } from 'tldraw'

export interface Callbacks {
  connect: () => Promise<void>
  toast?: typeof toast
  onRemoteChange?: () => void
  onLocalChange?: () => void
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
