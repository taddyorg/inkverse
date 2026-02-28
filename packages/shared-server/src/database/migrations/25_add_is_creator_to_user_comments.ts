import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_comments', (table) => {
    table.boolean('is_creator').notNullable().defaultTo(false);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_comments', (table) => {
    table.dropColumn('is_creator');
  });
}
