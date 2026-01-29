import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_comments', (table) => {
    // Primary key
    table.bigIncrements('id').primary();

    // Unique identifier
    table.uuid('uuid').unique().notNullable();

    // Timestamps
    table.bigInteger('created_at').notNullable().defaultTo(knex.raw('extract(epoch from now())::bigint'));
    table.bigInteger('updated_at');

    // User who created the comment
    table.bigInteger('user_id').notNullable();

    // Comment content (2000 char limit enforced at application level)
    table.text('text').notNullable();

    // Target reference (the entity being commented on)
    table.uuid('target_uuid').notNullable();
    table.string('target_type', 50).notNullable(); // 'COMICISSUE'

    // Parent reference for context/querying
    table.uuid('parent_uuid').notNullable(); // e.g., series_uuid
    table.string('parent_type', 50).notNullable(); // 'COMICSERIES'

    // Reply threading (null = top-level comment)
    table.uuid('reply_to_comment_uuid');

    // Moderation
    table.boolean('is_visible').notNullable().defaultTo(true);
    table.integer('pinned_position'); // position in list (0 = top)

    // Indexes (type before uuid for lower cardinality first)
    table.index(['user_id']);
    table.index(['target_type', 'target_uuid', 'is_visible', 'reply_to_comment_uuid']);
    table.index(['parent_type', 'parent_uuid']);
    table.index(['reply_to_comment_uuid']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_comments');
}
