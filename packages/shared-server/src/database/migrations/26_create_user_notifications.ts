import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_notifications', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('created_at').notNullable();
    table.bigInteger('recipient_id').notNullable();
    table.bigInteger('sender_id').nullable();
    table.string('event_type', 50).notNullable();
    table.string('target_uuid', 255).notNullable();
    table.string('target_type', 50).notNullable();
    table.string('parent_uuid', 255).nullable();
    table.string('parent_type', 50).nullable();

    table.index(['recipient_id']);
    table.index(['recipient_id', 'created_at']);
    table.index(['recipient_id', 'event_type', 'target_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_notifications');
}
