import { createYjsProvider } from '@y-sweet/client'
import {
  SerializedSchema,
  StoreListener,
  TLRecord,
  TLStore,
  compareSchemas,
} from 'tldraw'
import { ref } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { YKeyValue } from 'y-utility/y-keyvalue'
import * as Y from 'yjs'
import api from '../api'
import { freshTLStore } from '../utils'
import { GlobalState } from './types'

export interface YState {
  ydoc: Y.Doc
  ystore: YKeyValue<TLRecord>
  meta: Y.Map<SerializedSchema>
}

// TODO: Refactor this to inside the component. Global callbacks are a hack.
export async function connectYSweet(state: GlobalState) {
  const { docId, active } = state
  const toast = state.func.toast

  if (!docId) {
    console.error('No docId set!')
    toast && toast.error('No docId set!')
    return
  }

  const promise = (async () => {
    try {
      const data = await api.getDocToken(docId)
      console.log(`[${docId}]`, 'Token:', data)
      const { token } = data
      if (!token)
        throw new Error(`Failed to get token! Data: ${JSON.stringify(data)}`)
      active.docId = docId
      active.token = ref(token)
    } catch (e) {
      console.error(`[${docId}]`, e)
      throw e
    }
  })()

  if (toast)
    await toast.promise(promise, {
      loading: 'Getting doc token...',
      success: 'Obtained token!',
      error: (err) => `Failed to connect: ${err.toString()}`,
    })
  else await promise
}

function setupSyncHandlers(
  tlstore: TLStore,
  ystate: YState,
  localCallback: () => void,
  remoteCallback: () => void,
) {
  const { ydoc, ystore, meta } = ystate

  /* Sync changes from TLStore to Yjs. */
  const handleTL2Y: StoreListener<TLRecord> = ({
    changes: { added, updated, removed },
  }) => {
    const a = Object.values(added)
    const u = Object.values(updated)
    const r = Object.values(removed)
    if (a.length + u.length + r.length < 1) return
    ydoc.transact(() => {
      a.forEach((o) => ystore.set(o.id, o))
      u.forEach(([, o]) => ystore.set(o.id, o))
      r.forEach((o) => ystore.delete(o.id))
    })
    localCallback()
  }
  // Subscribe to only user's document changes.
  const unsubTL2Y = tlstore.listen(handleTL2Y, {
    source: 'user',
    scope: 'document',
  })

  /* Sync changes from Yjs to TLStore. */
  const handleY2TL = (
    changes: Map<string, { action: 'delete' | 'update' | 'add' }>, // NOTE: incomplete type
    txn: Y.Transaction,
  ) => {
    if (txn.local) return

    const removeArr: TLRecord['id'][] = []
    const putArr: TLRecord[] = []

    changes.forEach(({ action }, id) => {
      if (action === 'add' || action === 'update') putArr.push(ystore.get(id)!)
      else if (action === 'delete') removeArr.push(id as TLRecord['id'])
    })

    if (removeArr.length + putArr.length < 1) return
    tlstore.mergeRemoteChanges(() => {
      removeArr.length > 0 && tlstore.remove(removeArr)
      putArr.length > 0 && tlstore.put(putArr)
    })
    remoteCallback()
  }
  ystore.on('change', handleY2TL)
  const unsubY2TL = () => ystore.off('change', handleY2TL)

  /* Verify schema version compatibility. */
  const localSchema = tlstore.schema.serialize()
  const handleMeta = () => {
    const remoteSchema = meta.get('schema')
    if (!remoteSchema) throw new Error('Document metadata corrupted!')

    if (compareSchemas(remoteSchema, localSchema) > 0)
      throw new Error('Client is outdated, please update!')
  }
  meta.observe(handleMeta)
  const unsubMeta = () => meta.unobserve(handleMeta)

  return () => {
    unsubTL2Y()
    unsubY2TL()
    unsubMeta()
  }
}

function syncInitial(tlstore: TLStore, ystate: YState) {
  const { ydoc, ystore, meta } = ystate
  const localSchema = tlstore.schema.serialize()

  /* If no initial state, set it. */
  if (ystore.yarray.length === 0) {
    ydoc.transact(() => {
      tlstore.allRecords().forEach((r) => ystore.set(r.id, r))
      meta.set('schema', localSchema)
    })
    return
  }

  /* Sync initial state to TLStore. */
  const remoteSchema = meta.get('schema')
  if (!remoteSchema) throw new Error('Document metadata corrupted!')

  const records = ystore.yarray.toJSON().map(({ val }) => val)
  let store = Object.fromEntries(records.map((r) => [r.id, r]))

  if (compareSchemas(remoteSchema, localSchema) < 0) {
    const migrated = tlstore.schema.migrateStoreSnapshot({
      schema: remoteSchema,
      store,
    })
    // NOTE: This shouldn't be possible given the schema check above.
    if (migrated.type === 'error') throw new Error(migrated.reason)

    // Sync migrated records to Yjs.
    ydoc.transact(() => {
      // Delete records removed during migration.
      records
        .filter(({ id }) => !migrated.value[id])
        .forEach(({ id }) => ystore.delete(id))
      // update TLStore with migrated records.
      Object.values(migrated.value).forEach((r) => ystore.set(r.id, r))
      meta.set('schema', localSchema)
    })

    store = migrated.value
  }
  // Load records to TLStore.
  tlstore.loadSnapshot({ store, schema: localSchema })
}

function createYState(docId: string) {
  const ydoc = new Y.Doc()
  const ystore = new YKeyValue<TLRecord>(ydoc.getArray(`tldraw-${docId}`))
  const meta = ydoc.getMap<SerializedSchema>(`tldraw-meta-${docId}`)
  const ystate: YState = { ydoc, ystore, meta }
  return ystate
}

export function initSync(state: GlobalState) {
  const unsub = subscribeKey(state.active, 'token', async (token) => {
    const active = state.active
    const toast = state.func.toast
    const docId = active.docId
    active.cleanPrev && active.cleanPrev()
    if (!token) return
    // NOTE: docId must have been set for token to be changed.
    if (!docId) throw new Error('How???')

    const ystate = createYState(docId)
    const conn = createYjsProvider(ystate.ydoc, token)
    const cleanup = () => {
      ystate.ystore.destroy()
      ystate.ydoc.destroy()
      conn.destroy()
    }

    while (!conn.synced) {
      while (!conn.wsconnected && Object.is(token, active.token)) {
        const n = conn.wsUnsuccessfulReconnects
        console.log(`[${docId}]`, 'Y Sweet Connection Attempt:', n)
        const promise = new Promise((next) => conn.once('status', next))
        let s = null
        if (toast)
          s = await toast.promise(promise, {
            loading: 'Connecting to syncher...',
            success: 'Connected!',
            error: 'Failed to connect!',
          })
        else s = await promise
        console.log(`[${docId}]`, 'Y Sweet Connection Status:', s)
      }

      if (!Object.is(token, active.token)) {
        cleanup()
        return
      }

      console.log(`[${docId}] Waiting for Y Sync...`)
      const promise = new Promise((next) => conn.once('synced', next))
      let s = null
      if (toast)
        s = await toast.promise(promise, {
          loading: 'Synching...',
          success: 'Synched!',
          error: 'Failed to sync!',
        })
      else s = await promise
      console.log(`[${docId}]`, 'Y Sync Status:', s)
    }

    active.tlstore = ref(freshTLStore())
    const tlstore = active.tlstore.store!
    const localCallback = state.func.onLocalChange ?? (() => {})
    const remoteCallback = state.func.onRemoteChange ?? (() => {})
    const presenceCallback = () =>
      (state.active.numUsers = conn.awareness.getStates().size)

    conn.awareness.on('change', presenceCallback)
    const unsubSync = setupSyncHandlers(
      tlstore,
      ystate,
      localCallback,
      remoteCallback,
    )
    syncInitial(tlstore, ystate)

    active.tlstore = ref({
      status: 'synced-remote',
      connectionStatus: 'online',
      store: tlstore,
    })

    const handleDisconnect = ({ status }: { status: string }) => {
      if (status === 'disconnected') {
        toast && toast.error('Disconnected!')
        active.tlstore = ref({
          status: 'synced-remote',
          connectionStatus: 'offline',
          store: tlstore,
        })
      } else if (status === 'connecting') {
        toast && toast.dismiss()
        toast && toast.loading('Reconnecting...')
      } else if (status === 'connected') {
        toast && toast.dismiss()
        toast && toast.success('Reconnected!')
        active.tlstore = ref({
          status: 'synced-remote',
          connectionStatus: 'online',
          store: tlstore,
        })
      }
    }
    conn.on('status', handleDisconnect)
    const unsubDisconnect = () => conn.off('status', handleDisconnect)

    /* Cleanup when token changes. */
    active.cleanPrev = () => {
      unsubSync()
      unsubDisconnect()
      cleanup()
      conn.awareness.off('change', presenceCallback)
    }
  })
  return () => {
    unsub()
    state.active.cleanPrev && state.active.cleanPrev()
  }
}
