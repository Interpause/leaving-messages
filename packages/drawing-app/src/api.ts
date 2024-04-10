import { ClientToken } from '@y-sweet/sdk'
import { BACKEND_URL } from './env'

interface Doc {
  id: string
  hidden: boolean
  ctime: string
  mtime: string
  dtime: string | null
}

async function getDocToken(docId: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/doc_token?doc=${docId}`)
  const data = await res.json()
  return data as { token: ClientToken }
}

async function listDocs() {
  const res = await fetch(`${BACKEND_URL}/api/v1/list_doc`)
  const data = await res.json()
  console.log('listDocs', data)
  return data as { docs: Doc[] }
}

async function setDocHidden(docId: string, hidden: boolean) {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/set_doc_hidden?doc=${docId}&hidden=${hidden}`,
  )
  const data = await res.json()
  return data
}

async function deleteDoc(docId: string) {
  const res = await fetch(`${BACKEND_URL}/api/v1/delete_doc?doc=${docId}`)
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
