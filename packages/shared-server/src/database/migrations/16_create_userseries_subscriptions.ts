import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('userseries_subscriptions', (table) => {
    // Primary key
    table.bigIncrements('id').primary();
    
    // Timestamps
    table.bigInteger('created_at').notNullable().defaultTo(knex.raw('extract(epoch from now())::bigint'));
    table.bigInteger('updated_at');

    
    // Foreign keys
    table.bigInteger('user_id').notNullable();
    table.uuid('series_uuid').notNullable();
    
    // Indexes
    table.index(['user_id']);
    table.index(['series_uuid']);
    table.unique(['user_id', 'series_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('userseries_subscriptions');
}