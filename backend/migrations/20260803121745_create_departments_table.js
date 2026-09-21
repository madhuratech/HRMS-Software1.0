/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('departments');
  if (!hasTable) {
    await knex.schema.createTable('departments', (table) => {
      table.increments('id').primary();
      table.string('department_name', 255).notNullable();
      table.string('department_code', 50).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Seed default departments
    await knex('departments').insert([
      { id: 1, department_name: 'Engineering', department_code: 'ENG' },
      { id: 2, department_name: 'Human Resources', department_code: 'HR' },
      { id: 3, department_name: 'Design', department_code: 'DSN' },
      { id: 4, department_name: 'Finance', department_code: 'FIN' },
      { id: 5, department_name: 'Sales', department_code: 'SLS' },
      { id: 6, department_name: 'Marketing', department_code: 'MKT' }
    ]);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('departments');
};
