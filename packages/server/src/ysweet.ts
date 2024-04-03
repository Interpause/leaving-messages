import { DocumentManager } from '@y-sweet/sdk'
import Elysia from 'elysia'
import { insertDoc, listAllDocs } from './sql'

const QUERY_PARAM_DOC = 'doc'

const manager = new DocumentManager(process.env.YSWEET_URL)

const randomId = () => Math.floor(Math.random() * 16777215).toString(16)

const createDoc = async (docId: string) => {
  insertDoc(docId)
  return await manager.getOrCreateDocAndToken(docId)
}

export const sweetPlugin = (app: Elysia) => {
  app.get('/doc_token', async ({ query, set }) => {
    const docId = query[QUERY_PARAM_DOC]
    if (!docId) {
      set.status = 400
      return 'Please provide a document id.'
    }
    const token = await createDoc(docId)
    return { token }
  })
  app.get('/random_doc', async () => {
    const docId = randomId()
    const token = await createDoc(docId)
    return { token }
  })
  app.get('/list_doc', async () => {
    const docs = await listAllDocs()
    return { docs }
  })

  return app
}
