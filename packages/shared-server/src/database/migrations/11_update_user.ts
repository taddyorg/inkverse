import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
    table.dropColumn('reset_password_expiry');
    table.dropColumn('name');
    table.dropColumn('countries');
    table.dropColumn('languages');
    table.dropColumn('platforms');
    table.dropColumn('genres');
    table.dropColumn('timezone');
    table.dropColumn('profile_image_url');
  });

  await knex.schema.alterTable('users', (table) => {
    table.bigInteger('created_at').notNullable();
    table.bigInteger('updated_at');
    table.bigInteger('reset_password_expiry');
    table.string('email').alter().notNullable();
    table.string('google_id').unique();
    table.string('apple_id').unique();
    table.string('age_range');
    table.integer('birth_year'); // For users under 18
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
    table.dropColumn('reset_password_expiry');
    table.dropColumn('google_id');
    table.dropColumn('apple_id');
    table.dropColumn('age_range');
    table.dropColumn('birth_year');
  });
}