import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { sweetPlugin } from './ysweet'

const app = new Elysia()
  .use(swagger())
  .group('/api/v1', (app) => app.use(sweetPlugin))
  .get('/', () => 'https://interpause.dev/resume')
  .listen(3000)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
)
