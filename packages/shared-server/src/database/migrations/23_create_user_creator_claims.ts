import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_creator_claims', (table) => {
    // Primary key
    table.bigIncrements('id').primary();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at');

    // User who is claiming the creator
    table.bigInteger('user_id').notNullable();

    // Creator being claimed
    table.uuid('creator_uuid').notNullable();

    // Claim status
    table.string('status', 20).notNullable().defaultTo('PENDING');

    // Token for verifying the claim callback
    table.string('claim_token', 100).unique().notNullable();

    // Token expiry (epoch seconds)
    table.bigInteger('claim_token_expiry').notNullable();

    // Constraints
    table.unique(['user_id', 'creator_uuid']);

    // Indexes
    table.index(['user_id']);
    table.index(['creator_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_creator_claims');
}
