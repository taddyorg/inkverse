import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_device', (table) => {
    table.dropUnique(['user_id', 'fcm_token', 'platform']);
    table.unique(['user_id', 'fcm_token', ]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_device', (table) => {
    table.dropUnique(['user_id', 'fcm_token']);
  });
} 