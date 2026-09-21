/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('probations');
  if (!hasTable) {
    await knex.schema.createTable('probations', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.date('probation_start_date').notNullable();
      table.date('probation_end_date').notNullable();
      table.string('reporting_manager', 255).notNullable();
      table.enum('status', ['Due for Review', 'Confirmed', 'Extended']).defaultTo('Due for Review');
      table.string('rating', 100).nullable();
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
  await knex.schema.dropTableIfExists('probations');
};
