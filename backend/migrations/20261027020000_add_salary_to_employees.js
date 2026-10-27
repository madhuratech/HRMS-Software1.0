/**
 * Migration: Add salary column to employees table if missing
 */
exports.up = async function(knex) {
  const hasEmployees = await knex.schema.hasTable('employees');
  if (hasEmployees) {
    const hasSalary = await knex.schema.hasColumn('employees', 'salary');
    if (!hasSalary) {
      await knex.schema.alterTable('employees', (table) => {
        table.decimal('salary', 12, 2).defaultTo(0.00).after('net_salary');
      });
      console.log('✅ Added salary column to employees table.');
    }
  }
};

exports.down = async function(knex) {
  const hasEmployees = await knex.schema.hasTable('employees');
  if (hasEmployees) {
    const hasSalary = await knex.schema.hasColumn('employees', 'salary');
    if (hasSalary) {
      await knex.schema.alterTable('employees', (table) => {
        table.dropColumn('salary');
      });
    }
  }
};
