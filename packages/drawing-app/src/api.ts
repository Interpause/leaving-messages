import { ClientToken } from '@y-sweet/sdk'
import { useLayoutEffect, useState } from 'react'
import useWebSocket from 'react-use-websocket'
import { BACKEND_URL } from './env'

interface ServerState {
  displayOn: boolean
  version: string
}

export interface Doc {
  id: string
  hidden: boolean
  ctime: string
  mtime: string
  dtime: string | null
}

async function getDocToken(docId: string) {
  const params = new URLSearchParams({ doc: docId }).toString()
  const res = await fetch(`${BACKEND_URL}/api/v1/doc_token?${params}`)
  const data = await res.json()
  return data as { token: ClientToken }
}

interface listDocOpts {
  filterHidden?: boolean
  filterShown?: boolean
  filterDeleted?: boolean
}

async function listDocs(opts: listDocOpts = {}) {
  const params = new URLSearchParams({
    filter_hidden: `${opts.filterHidden ?? true}`,
    filter_shown: `${opts.filterShown ?? false}`,
    filter_deleted: `${opts.filterDeleted ?? true}`,
  }).toString()
  const res = await fetch(`${BACKEND_URL}/api/v1/list_doc?${params}`)
  const data = await res.json()
  return data as { docs: Doc[] }
}

async function setDocHidden(docId: string, hidden: boolean) {
  const params = new URLSearchParams({
    doc: docId,
    hidden: `${hidden}`,
  }).toString()
  const res = await fetch(`${BACKEND_URL}/api/v1/set_doc_hidden?${params}`)
  const data = await res.json()
  return data
}

async function deleteDoc(docId: string) {
  const params = new URLSearchParams({ doc: docId }).toString()
  const res = await fetch(`${BACKEND_URL}/api/v1/delete_doc?${params}`)
  const data = await res.json()
  return data
}

async function randomDoc() {
  const res = await fetch(`${BACKEND_URL}/api/v1/random_doc`)
  const data = await res.json()
  return data as { docId: string }
}

async function getState() {
  const res = await fetch(`${BACKEND_URL}/api/state`)
  const data = await res.json()
  return data as ServerState
}

async function patchState(changes: object) {
  const res = await fetch(`${BACKEND_URL}/api/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  const data = await res.json()
  return data
}

type WSEvent = { event: 'state'; msg: ServerState } | { event: 'list_update' }

function useServerState() {
  const [lastKnown, setLastKnown] = useState<Partial<ServerState>>({})
  const [lastEvent, setLastEvent] = useState<WSEvent['event']>()
  const url = `${BACKEND_URL.replace('http', 'ws')}/api/event`
  const { lastJsonMessage } = useWebSocket<WSEvent | null>(url, {
    retryOnError: true,
    reconnectAttempts: 999999999,
  })

  // NOTE: Websocket will publish state on open, no need to manual fetch.
  useLayoutEffect(() => {
    if (lastJsonMessage === null) return
    console.log('[server event]', lastJsonMessage)
    const { event } = lastJsonMessage
    if (event === 'state') setLastKnown(lastJsonMessage.msg)
    else if (event === 'list_update') {
      setLastEvent(undefined)
      // Force rerender.
      setTimeout(() => setLastEvent('list_update'))
    } else setLastEvent(event)
  }, [lastJsonMessage])

  return [lastEvent, lastKnown] as const
}

const api = {
  getDocToken,
  listDocs,
  setDocHidden,
  deleteDoc,
  randomDoc,
  getState,
  patchState,
  useServerState,
}

export default api
