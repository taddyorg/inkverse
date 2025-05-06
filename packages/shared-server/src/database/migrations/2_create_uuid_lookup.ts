import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // enum for content_type
  await knex.raw(`CREATE TYPE content_type AS ENUM ('COMICSERIES', 'COMICISSUE', 'CREATOR')`);

  // create table
  await knex.schema.createTable('uuid_lookup', (table) => {
    table.bigIncrements('id', { primaryKey: false });
    table.uuid('uuid').primary();
    table.specificType('taddy_type', 'content_type');
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at');
    table.index(['id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('uuid_lookup');
  await knex.raw('DROP TYPE IF EXISTS content_type');
}