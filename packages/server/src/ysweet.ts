import { DocumentManager } from '@y-sweet/sdk'
import Elysia from 'elysia'
import { delDoc, insertDoc, listAllDocs, setDocHidden } from './sql'

const QUERY_PARAM_DOC = 'doc'

const manager = new DocumentManager(process.env.YSWEET_URL)

const randomId = () =>
  'solo-' +
  '0123456789abcdef'
    .split('')
    .map(function (v, i, a) {
      return i > 5 ? null : a[Math.floor(Math.random() * 16)]
    })
    .join('')

const createDoc = async (docId: string) => {
  insertDoc(docId)
  return await manager.getOrCreateDocAndToken(docId)
}

export const sweetPlugin = (app: Elysia) => {
  return app
    .get('/doc_token', async ({ query, set }) => {
      const docId = query[QUERY_PARAM_DOC]
      if (!docId) {
        set.status = 400
        return { error: 'Please provide a document id.' }
      }
      const token = await createDoc(docId)
      token.url = 'wss://miro-ws.interpause.dev/doc/ws'
      return { token }
    })
    .get('/random_doc', async () => {
      const docId = randomId()
      return { docId }
    })
    .get('/list_doc', async ({ query }) => {
      const docs = await listAllDocs(query)
      return { docs }
    })
    .get('/set_doc_hidden', async ({ query, set }) => {
      const docId = query[QUERY_PARAM_DOC]
      if (!docId) {
        set.status = 400
        return { error: 'Please provide a document id.' }
      }
      const hidden = query.hidden === 'true'
      setDocHidden(docId, hidden)
      return { success: true }
    })
    .get('/delete_doc', async ({ query, set }) => {
      const docId = query[QUERY_PARAM_DOC]
      if (!docId) {
        set.status = 400
        return { error: 'Please provide a document id.' }
      }
      delDoc(docId)
      return { success: true }
    })
}
