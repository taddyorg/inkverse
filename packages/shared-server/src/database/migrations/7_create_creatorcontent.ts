import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('creatorcontent', (table) => {
    table.bigIncrements('id', { primaryKey: false });
    table.uuid('uuid').primary();
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at');
    table.string('hash');
    table.uuid('content_uuid').notNullable();
    table.specificType('content_type', 'content_type').notNullable();
    table.uuid('creator_uuid').notNullable();
    table.specificType('roles', 'varchar(255)[]');
    table.integer('position');
    table.integer('content_position');
    table.unique(['content_uuid', 'creator_uuid']);
    table.index(['content_uuid']);
    table.index(['creator_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('creatorcontent');
}