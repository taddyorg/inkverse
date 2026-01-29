import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_reports', (table) => {
    // Primary key
    table.bigIncrements('id').primary();

    // Timestamps
    table.bigInteger('created_at').notNullable().defaultTo(knex.raw('extract(epoch from now())::bigint'));

    // User who made the report
    table.bigInteger('reporter_user_id').notNullable();

    // Target reference (the entity being reported)
    table.uuid('target_uuid').notNullable();
    table.string('target_type', 50).notNullable(); // 'COMMENT', 'COMICSERIES'

    // Report details
    table.string('report_type', 50).notNullable(); // 'SPAM', 'HARASSMENT', 'SPOILER'
    table.text('additional_info');

    // Unique constraint (one report per user per target)
    table.unique(['target_type', 'target_uuid', 'reporter_user_id']);

    // Indexes (type before uuid for lower cardinality first)
    table.index(['target_type', 'target_uuid']);
    table.index(['reporter_user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_reports');
}
