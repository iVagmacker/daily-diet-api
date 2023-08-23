/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const meals = await knex('meals').select()

      return { meals }
    },
  )

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    const meals = await knex('meals')
      .where({
        id,
      })
      .first()

    return { meals }
  })

  app.post('/', async (request, reply) => {
    const createdMealsBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      is_active: z.boolean(),
      init_date: z.string(),
      user_id: z.string(),
    })

    const { name, description, init_date, is_active, user_id } =
      createdMealsBodySchema.parse(request.body)

    const { sessionId } = request.cookies

    const users = await knex('users').where('session_id', sessionId).select()

    if (users.filter((user) => user.id === user_id).length === 0) {
      throw new Error('User not found')
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      init_date,
      is_active,
      user_id,
    })
    return reply.status(201).send()
  })

  app.put('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const createdMealsBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      is_active: z.boolean(),
      init_date: z.string(),
      user_id: z.string(),
    })

    const { name, description, init_date, is_active, user_id } =
      createdMealsBodySchema.parse(request.body)

    const { id } = getMealsParamsSchema.parse(request.params)

    await knex('meals').where({ id }).update({
      name,
      description,
      init_date,
      is_active,
      user_id,
    })
    return reply.status(201).send()
  })

  app.delete('/:id', async (request, reply) => {
    const getMealsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getMealsParamsSchema.parse(request.params)

    await knex('meals').where({ id }).del()

    return reply.status(201).send()
  })

  app.get(
    '/summary/:userId',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const getMealsParamsSchema = z.object({
        userId: z.string().uuid(),
      })

      const { userId } = getMealsParamsSchema.parse(request.params)

      const meals = await knex('meals')
        .where({
          user_id: userId,
        })
        .select()

      return { meals }
    },
  )

  app.get(
    '/details/:userId',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const getMealsParamsSchema = z.object({
        userId: z.string().uuid(),
      })

      const { userId } = getMealsParamsSchema.parse(request.params)

      const meals = await knex('meals')
        .where({
          user_id: userId,
        })
        .select()

      const summaryMeals = {
        totalMeals: meals.length,
        totalMealsActive: meals.filter((item) => item.is_active === 1).length,
        totalMealsDesactive: meals.filter((item) => item.is_active === 0)
          .length,
        totalSequenceMeal: mealSequenciaActive(meals),
      }

      return { summaryMeals }
    },
  )
}

function mealSequenciaActive(meal: any[]): number {
  let sequenceContinued = false
  let count = 0
  const sequences = []
  for (let i = 0; i < meal.length; i++) {
    const item = meal[i].is_active

    if (item === 0 && sequenceContinued === true) {
      sequenceContinued = false
      sequences.push(count)
      count = 0
      continue
    }

    if (item === 1) {
      sequenceContinued = true
      count++
    }

    if (i === meal.length - 1 && item === 1) {
      sequences.push(count)
    }
  }

  const longestCount = sequences.length ? Math.max(...sequences) : 0

  return longestCount
}
