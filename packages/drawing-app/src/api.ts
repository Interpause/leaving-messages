import { ClientToken } from '@y-sweet/sdk'
import { BACKEND_URL } from './env'

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
  const filterHidden = `${opts.filterHidden ?? true}`
  const filterShown = `${opts.filterShown ?? false}`
  const filterDeleted = `${opts.filterDeleted ?? true}`
  const params = new URLSearchParams({
    filterHidden,
    filterShown,
    filterDeleted,
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

const api = {
  getDocToken,
  listDocs,
  setDocHidden,
  deleteDoc,
  randomDoc,
}

export default api
