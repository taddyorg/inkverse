import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('creator', (table) => {
    table.string('links_hash');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('creator', (table) => {
    table.dropColumn('links_hash');
  });
}