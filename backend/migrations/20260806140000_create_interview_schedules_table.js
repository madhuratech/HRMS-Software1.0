/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('interview_schedules');
  if (!hasTable) {
    await knex.schema.createTable('interview_schedules', (table) => {
      table.increments('id').primary();
      table.integer('candidate_id').notNullable();
      table.integer('interviewer_id').notNullable();
      table.enum('interview_round', [
        'HR Round',
        'Technical Round',
        'Manager Round',
        'Final Round'
      ]).notNullable();
      table.enum('interview_mode', [
        'Online',
        'Offline',
        'Telephonic'
      ]).notNullable();
      table.date('interview_date').notNullable();
      table.time('interview_time').notNullable();
      table.string('location', 255).nullable();
      table.string('meeting_link', 500).nullable();
      table.enum('status', [
        'Scheduled',
        'Rescheduled',
        'Completed',
        'Cancelled',
        'No Show'
      ]).defaultTo('Scheduled');
      table.text('remarks').nullable();
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
  await knex.schema.dropTableIfExists('interview_schedules');
};
