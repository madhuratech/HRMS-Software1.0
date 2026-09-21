/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('offer_letters');
  if (!hasTable) {
    await knex.schema.createTable('offer_letters', (table) => {
      table.increments('id').primary();
      table.string('candidate_name', 255).notNullable();
      table.string('job_position', 255).notNullable();
      table.integer('department_id').notNullable();
      table.string('salary_offered', 100).notNullable();
      table.date('joining_date').notNullable();
      table.string('reporting_manager', 255).notNullable();
      table.enum('employment_type', ['Full-time', 'Part-time', 'Contract']).defaultTo('Full-time');
      table.date('offer_expiry_date').notNullable();
      table.text('notes').nullable();
      table.enum('status', ['Pending', 'Accepted', 'Rejected']).defaultTo('Pending');
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
  await knex.schema.dropTableIfExists('offer_letters');
};
