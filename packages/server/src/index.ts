import { staticPlugin } from '@elysiajs/static'
import { swagger } from '@elysiajs/swagger'
import { Elysia, t } from 'elysia'
import { docPlugin } from './docs'
import './sql'

const app = new Elysia()
  .state({ displayOn: true, version: 'v1' })
  .use(swagger())
  .use(staticPlugin({ prefix: '/' }))
  .group('/api/v1', (app) => app.use(docPlugin))
  .get('/api/state', ({ store }) => store)
  .patch(
    '/api/state',
    ({ store, body }) => {
      const updated = { ...store, ...body }
      app.server?.publish('state', JSON.stringify(updated))
      return Object.assign(store, updated)
    },
    { body: t.Object({}, { additionalProperties: true }) },
  )
  .ws('/api/state', {
    open(ws) {
      ws.subscribe('state')
      ws.publish('state', ws.data.store)
    },
    close(ws) {
      ws.unsubscribe('state')
    },
  })
  .listen({ hostname: '0.0.0.0', port: 3000 })

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
