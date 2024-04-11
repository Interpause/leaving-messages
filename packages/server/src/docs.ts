import { DocumentManager } from '@y-sweet/sdk'
import { Elysia, t } from 'elysia'
import { wsPub } from '.'
import { delDoc, insertDoc, listAllDocs, setDocHidden } from './sql'

const QUERY_PARAM_DOC = 'doc'
const TIME_LIMIT = 0.5

const manager = new DocumentManager(process.env.YSWEET_URL)

const randomId = () =>
  '0123456789abcdef'
    .split('')
    .map(function (v, i, a) {
      return i > 5 ? null : a[Math.floor(Math.random() * 16)]
    })
    .join('')

const createDoc = async (docId: string) => {
  const isNew = insertDoc(docId)
  return [isNew, await manager.getOrCreateDocAndToken(docId)] as const
}

export const docPlugin = (app: Elysia) => {
  return app
    .state({ sharedDocId: '', sharedDocTime: 0 })
    .get(
      '/doc_token',
      async ({ query }) => {
        const docId = query[QUERY_PARAM_DOC]
        const [isNew, token] = await createDoc(docId)
        token.url = 'wss://miro-ws.interpause.dev/doc/ws'
        if (isNew) wsPub({ event: 'list_update' })
        return { token }
      },
      { query: t.Object({ [QUERY_PARAM_DOC]: t.String() }) },
    )
    .get('/random_doc', async () => {
      const docId = 'solo-' + randomId()
      return { docId }
    })
    .get('/shared_doc', async ({ store }) => {
      const now = Date.now() / 1000 / 60
      if (store.sharedDocId === '' || now - store.sharedDocTime > TIME_LIMIT) {
        const docId = 'shared-' + randomId()
        store.sharedDocId = docId
        store.sharedDocTime = now
      }
      return { docId: store.sharedDocId }
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
        wsPub({ event: 'list_update' })
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
        wsPub({ event: 'list_update' })
        return { success: true }
      },
      { query: t.Object({ [QUERY_PARAM_DOC]: t.String() }) },
    )
}
