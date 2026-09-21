/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('candidates');
  if (!hasTable) {
    await knex.schema.createTable('candidates', (table) => {
      table.increments('id').primary();
      table.string('candidate_name', 255).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('mobile_number', 20).notNullable();
      table.enum('gender', ['Male', 'Female', 'Other']).defaultTo('Male');
      table.integer('department_id').notNullable();
      table.string('job_position', 255).notNullable();
      table.date('date_of_birth').nullable();
      table.string('resume', 500).nullable();
      table.string('experience', 50).nullable();
      table.string('current_company', 255).nullable();
      table.decimal('current_salary', 12, 2).nullable();
      table.decimal('expected_salary', 12, 2).nullable();
      table.string('notice_period', 100).nullable();
      table.text('skills').nullable();
      table.text('address').nullable();
      table.enum('status', [
        'Applied',
        'Shortlisted',
        'Interview Scheduled',
        'Interview Completed',
        'Selected',
        'Rejected',
        'On Hold',
        'Hired'
      ]).defaultTo('Applied');
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
  await knex.schema.dropTableIfExists('candidates');
};
