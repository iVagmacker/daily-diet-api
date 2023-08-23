// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Users {
    users: {
      id: string
      name: string
      email: string
      created_at: string
      session_id?: string
    }
  }

  export interface Meals {
    meals: {
      id: string
      name: string
      description: string
      created_at: string
      user_id: string
      is_active: boolean
      init_date: string
    }
  }
}
