import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('oauth_token', (table) => {
    table.bigInteger('refresh_token_expires_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('oauth_token', (table) => {
    table.dropColumn('refresh_token_expires_at');
  });
}