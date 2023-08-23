import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const users = await knex('users').where('session_id', sessionId).select()
    const all = await knex('users').select()
    console.log(all)

    return { users }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getUserParamsSchema.parse(request.params)
    const { sessionId } = request.cookies

    const users = await knex('users')
      .where({
        session_id: sessionId,
        id,
      })
      .first()

    return { users }
  })

  app.post('/', async (request, reply) => {
    const createdUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
    })

    const { name, email } = createdUserBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
    })
    return reply.status(201).send()
  })
}
