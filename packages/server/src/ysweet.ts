import { DocumentManager } from '@y-sweet/sdk'
import Elysia from 'elysia'

const QUERY_PARAM_DOC = 'doc'

const manager = new DocumentManager(process.env.YSWEET_URL)

export const sweetPlugin = (app: Elysia) => {
  return app.get('/doc_token', async ({ query, set }) => {
    const docId = query[QUERY_PARAM_DOC]
    if (!docId) {
      set.status = 400
      return 'Please provide a document id.'
    }
    const token = await manager.getOrCreateDocAndToken(docId)
    return { token: token }
  })
}
