/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('new_joiners');
  if (!hasTable) {
    await knex.schema.createTable('new_joiners', (table) => {
      table.increments('id').primary();
      table.string('employee_name', 255).notNullable();
      table.integer('department_id').notNullable();
      table.string('designation', 255).notNullable();
      table.date('joining_date').notNullable();
      table.string('reporting_manager', 255).notNullable();
      table.string('checklist', 255).notNullable();
      table.string('buddy', 255).nullable();
      table.enum('status', ['Pending', 'In Progress', 'Completed']).defaultTo('In Progress');
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
  await knex.schema.dropTableIfExists('new_joiners');
};
