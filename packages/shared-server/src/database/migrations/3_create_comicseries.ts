import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comicseries', (table) => {
    table.bigIncrements('id', { primaryKey: false });
    table.uuid('uuid').primary();
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.timestamp('updated_at');
    table.text('sss_url').unique();
    table.string('sss_owner_name');
    table.text('sss_owner_public_email');
    table.string('hash').unique();
    table.string('issues_hash');
    table.bigInteger('date_published');
    table.string('name');
    table.text('description');
    table.json('cover_image');
    table.json('banner_image');
    table.json('thumbnail_image');
    table.string('series_type');
    table.string('language');
    table.string('content_rating');
    table.string('genre0');
    table.string('genre1');
    table.string('genre2');
    table.specificType('tags', 'varchar(255)[]');
    table.string('short_url').notNullable().unique();
    table.text('copyright');
    table.boolean('is_blocked');
    table.string('status');
    table.string('series_layout');
    table.uuid('hosting_provider_uuid');
    table.specificType('scopes_for_exclusive_content', 'varchar(255)[]');
    table.index(['date_published']);
    table.index(['id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comicseries');
}