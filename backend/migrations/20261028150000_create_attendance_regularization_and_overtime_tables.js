/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasReg = await knex.schema.hasTable('attendance_regularizations');
  if (!hasReg) {
    await knex.schema.createTable('attendance_regularizations', function(table) {
      table.increments('id').primary();
      table.integer('employee_id').nullable();
      table.string('employee_name', 100).nullable();
      table.string('avatar', 255).nullable();
      table.string('date', 50).notNullable();
      table.string('type', 50).notNullable();
      table.text('reason').nullable();
      table.string('status', 20).defaultTo('Pending');
      table.string('time', 50).defaultTo('--');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasOt = await knex.schema.hasTable('overtime_records');
  if (!hasOt) {
    await knex.schema.createTable('overtime_records', function(table) {
      table.increments('id').primary();
      table.integer('employee_id').nullable();
      table.string('employee_name', 100).notNullable();
      table.string('avatar', 255).nullable();
      table.string('date', 50).notNullable();
      table.string('hours', 50).notNullable();
      table.text('reason').nullable();
      table.string('status', 20).defaultTo('Pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('overtime_records');
  await knex.schema.dropTableIfExists('attendance_regularizations');
};
