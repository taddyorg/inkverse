import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_notifications', (table) => {
    table.string('context_uuid', 255).nullable();
    table.string('context_type', 50).nullable();
    table.index(['context_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_notifications', (table) => {
    table.dropIndex(['context_uuid']);
    table.dropColumn('context_type');
    table.dropColumn('context_uuid');
  });
}
