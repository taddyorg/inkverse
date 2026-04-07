import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_settings', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('created_at').notNullable();
    table.bigInteger('updated_at').nullable();
    table.bigInteger('user_id').notNullable();
    table.string('event_type', 50).notNullable();
    table.string('channel', 10).notNullable();
    table.boolean('is_enabled').notNullable();

    table.unique(['user_id', 'event_type', 'channel']);
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notification_settings');
}
