import { DocumentManager } from '@y-sweet/sdk'
import { Elysia, t } from 'elysia'
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

export const docPlugin = (app: Elysia) => {
  return app
    .get(
      '/doc_token',
      async ({ query }) => {
        const docId = query[QUERY_PARAM_DOC]
        const token = await createDoc(docId)
        token.url = 'wss://miro-ws.interpause.dev/doc/ws'
        return { token }
      },
      { query: t.Object({ [QUERY_PARAM_DOC]: t.String() }) },
    )
    .get('/random_doc', async () => {
      const docId = randomId()
      return { docId }
    })
    .get(
      '/list_doc',
      async ({ query }) => {
        const docs = listAllDocs(query)
        return { docs }
      },
      {
        query: t.Object({
          filter_hidden: t.BooleanString(),
          filter_shown: t.BooleanString(),
          filter_deleted: t.BooleanString(),
        }),
      },
    )
    .get(
      '/set_doc_hidden',
      async ({ query }) => {
        const docId = query[QUERY_PARAM_DOC]
        setDocHidden(docId, query.hidden)
        return { success: true }
      },
      {
        query: t.Object({
          [QUERY_PARAM_DOC]: t.String(),
          hidden: t.BooleanString(),
        }),
      },
    )
    .get(
      '/delete_doc',
      async ({ query }) => {
        const docId = query[QUERY_PARAM_DOC]
        delDoc(docId)
        return { success: true }
      },
      { query: t.Object({ [QUERY_PARAM_DOC]: t.String() }) },
    )
}
