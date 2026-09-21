/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('job_publishings');
  if (!hasTable) {
    await knex.schema.createTable('job_publishings', (table) => {
      table.increments('id').primary();
      table.integer('job_id').notNullable();
      table.enum('channel', ['CAREER_PAGE', 'LINKEDIN', 'INDEED']).notNullable();
      table.string('external_job_id', 255).nullable();
      table.enum('status', [
        'DRAFT',
        'PENDING',
        'PUBLISHING',
        'PUBLISHED',
        'FAILED',
        'CLOSING',
        'CLOSED',
        'REMOVED',
        'NOT_CONNECTED'
      ]).defaultTo('DRAFT');
      table.string('external_url', 500).nullable();
      table.timestamp('published_at').nullable();
      table.timestamp('closed_at').nullable();
      table.timestamp('last_synced_at').nullable();
      table.text('error_message').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.unique(['job_id', 'channel']);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('job_publishings');
};
