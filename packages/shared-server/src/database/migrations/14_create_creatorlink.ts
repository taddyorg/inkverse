import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('creatorlink', (table) => {
    table.bigIncrements('id');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at');
    table.uuid('creator_uuid').notNullable();
    table.string('type').notNullable();
    table.string('base_url');
    table.string('value').notNullable();
    table.index(['creator_uuid']);
    table.index(['creator_uuid', 'type']);
    table.index(['type', 'value']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('creatorlink');
}