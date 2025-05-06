import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('oauth_token', (table) => {
    table.bigIncrements('id').primary().notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at');
    table.text('refresh_token').notNullable();
    table.bigInteger('user_id').notNullable();
    table.uuid('hosting_provider_uuid').notNullable();
    table.unique(['user_id', 'hosting_provider_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('oauth_token');
}