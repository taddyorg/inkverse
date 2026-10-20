import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('comicseries', (table) => {
    table.text('tagline');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('comicseries', (table) => {
    table.dropColumn('tagline');
  });
}
