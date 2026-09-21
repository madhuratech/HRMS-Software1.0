/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('orientations');
  if (!hasTable) {
    await knex.schema.createTable('orientations', (table) => {
      table.increments('id').primary();
      table.integer('new_joiner_id').notNullable();
      table.string('title', 255).notNullable();
      table.date('orientation_date').notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').notNullable();
      table.string('trainer', 255).notNullable();
      table.string('venue', 255).notNullable();
      table.enum('session_type', ['Online', 'Offline', 'Hybrid']).defaultTo('Offline');
      table.string('meeting_link', 500).nullable();
      table.enum('status', ['Scheduled', 'Completed', 'Pending']).defaultTo('Scheduled');
      table.text('notes').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('orientations');
};
