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
      wsPub({ event: 'state', msg: updated })
      return Object.assign(store, updated)
    },
    { body: t.Object({}, { additionalProperties: true }) },
  )
  .get('/api/refresh_all', async () => {
    wsPub({ event: 'refresh_all' })
  })
  .ws('/api/event', {
    open(ws) {
      ws.subscribe('event')
      ws.send({ event: 'state', msg: app.store })
      ws.send({ event: 'list_update' })
    },
    close(ws) {
      ws.unsubscribe('event')
    },
  })
  .listen({ hostname: '0.0.0.0', port: 3000 })

export const wsPub = (data: { event: string; msg?: object }) =>
  app.server?.publish('event', JSON.stringify(data))

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
