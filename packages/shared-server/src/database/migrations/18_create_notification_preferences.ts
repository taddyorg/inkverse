import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notification_preferences', (table) => {
    // Primary key
    table.bigIncrements('id').primary();
    
    // Timestamps - using bigInteger for epoch timestamps to match the pattern
    table.bigInteger('created_at').notNullable().defaultTo(knex.raw('extract(epoch from now())::bigint'));
    table.bigInteger('updated_at');
    
    // Foreign key to users table
    table.bigInteger('user_id').notNullable();
    
    // Notification configuration
    table.string('notification_type').notNullable();

    // Value of the preference
    table.string('value');
    
    // Indexes for performance
    table.index(['user_id']);
    
    // Unique constraint to prevent duplicate preferences
    table.unique(['user_id', 'notification_type', 'value']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notification_preferences');
}