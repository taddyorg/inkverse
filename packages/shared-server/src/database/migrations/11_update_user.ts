import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('google_id').unique();
    table.string('apple_id').unique();
    table.string('age_range');
    table.integer('birth_year'); // For users under 18
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('google_id');
    table.dropColumn('apple_id');
    table.dropColumn('age_range');
    table.dropColumn('birth_year');
  });
}