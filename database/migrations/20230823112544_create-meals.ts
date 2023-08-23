import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists('meals', (table) => {
    table.uuid('id').primary()
    table.string('name').notNullable()
    table.text('description').notNullable()
    table.integer('user_id').references('id').inTable('users')
    table.boolean('is_active').notNullable()
    table.timestamp('init_date').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
