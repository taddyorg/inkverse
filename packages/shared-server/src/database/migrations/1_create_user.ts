import type { Knex } from 'knex';

export const up = async (knex: Knex): Promise<void> => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('users', (table: Knex.TableBuilder) => {
    table.bigIncrements('id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at');
    table.string('name');
    table.text('email').unique();
    table.string('username', 80).unique();
    table.boolean('is_email_verified').defaultTo(false);
    table.string('reset_password_token');
    table.timestamp('reset_password_expiry');
    table.specificType('countries', 'varchar(255)[]');
    table.specificType('languages', 'varchar(255)[]');
    table.specificType('platforms', 'varchar(255)[]');
    table.specificType('genres', 'varchar(255)[]');
    table.string('timezone');
    table.text('profile_image_url');
  });
};

export const down = async (knex: Knex): Promise<void> => {
  await knex.schema.dropTableIfExists('users');
};