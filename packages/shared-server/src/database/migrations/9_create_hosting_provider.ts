import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hosting_provider', (table) => {
    table.bigIncrements('id', { primaryKey: false });
    table.uuid('uuid').primary();
    table.json('oauth')
    table.bigInteger('date_published');
    table.index(['id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('hosting_provider');
}