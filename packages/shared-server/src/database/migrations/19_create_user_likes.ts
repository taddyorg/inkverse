import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_likes', (table) => {
    // Primary key
    table.bigIncrements('id').primary();

    // Timestamps
    table.bigInteger('created_at').notNullable().defaultTo(knex.raw('extract(epoch from now())::bigint'));
    table.bigInteger('updated_at');

    // User who liked
    table.bigInteger('user_id').notNullable();

    // Polymorphic likeable reference
    table.uuid('likeable_uuid').notNullable();
    table.string('likeable_type', 50).notNullable(); // 'COMICISSUE', future: 'COMMENT'

    // Parent reference for efficient querying
    table.uuid('parent_uuid').notNullable(); // e.g., series_uuid for episodes
    table.string('parent_type', 50).notNullable(); // 'COMICSERIES', future: 'COMICISSUE'

    // Indexes (type before uuid for lower cardinality first)
    table.index(['user_id']);
    table.index(['likeable_type', 'likeable_uuid']);
    table.index(['parent_type', 'parent_uuid']);
    table.unique(['user_id', 'likeable_type', 'likeable_uuid']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_likes');
}
