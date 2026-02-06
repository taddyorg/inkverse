import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_likes', (table) => {
    table.index(['likeable_type', 'created_at', 'parent_uuid']);
  });

  await knex.schema.alterTable('user_comments', (table) => {
    table.index(['parent_type', 'is_visible', 'created_at', 'parent_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_likes', (table) => {
    table.dropIndex(['likeable_type', 'created_at', 'parent_uuid']);
  });

  await knex.schema.alterTable('user_comments', (table) => {
    table.dropIndex(['parent_type', 'is_visible', 'created_at', 'parent_uuid']);
  });
}
