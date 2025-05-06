import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema
    .createTable('comicissue', (table) => {
      table.bigIncrements('id', { primaryKey: false });
      table.uuid('uuid').primary();
      table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
      table.timestamp('updated_at');
      table.string('hash').unique();
      table.string('stories_hash');
      table.bigInteger('date_published');
      table.string('name');
      table.text('creator_note');
      table.uuid('series_uuid').notNullable();
      table.json('banner_image');
      table.json('thumbnail_image');
      table.boolean('is_removed');
      table.boolean('is_blocked');
      table.integer('position');
      table.text('push_notification_message');
      table.specificType('scopes_for_exclusive_content', 'varchar(255)[]');
      table.bigInteger('date_exclusive_content_is_available');
      table.index(['id']);
      table.index(['series_uuid']);
      table.index(['series_uuid', 'date_published']);
      table.index(['series_uuid', 'position']);
    });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comicissue');
}