/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Check if column employee_code exists on employees
  const hasEmployeeCode = await knex.schema.hasColumn('employees', 'employee_code');
  if (!hasEmployeeCode) {
    await knex.schema.alterTable('employees', (table) => {
      table.string('employee_code', 50).nullable().defaultTo(null);
    });
  }

  // 2. Safely populate existing employees with sequential EMP#### codes based on their existing order
  // DO NOT touch primary key employees.id
  const employees = await knex('employees')
    .select('id', 'employee_code', 'employee_id')
    .orderBy('id', 'asc');

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i];
    // If not already set with a valid sequential EMP code
    const targetCode = `EMP${String(i + 1).padStart(4, '0')}`;
    await knex('employees')
      .where('id', emp.id)
      .update({
        employee_code: targetCode,
        employee_id: targetCode
      });
  }

  // 3. Add unique constraint/index on employee_code if not already existing
  try {
    const rawIndexes = await knex.raw(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'employees' 
        AND COLUMN_NAME = 'employee_code'
    `);
    const existingIndexes = rawIndexes[0] || [];
    const hasUnique = existingIndexes.some(idx => idx.INDEX_NAME.toLowerCase().includes('unique') || idx.INDEX_NAME.toLowerCase().includes('employee_code'));

    if (!hasUnique) {
      await knex.schema.alterTable('employees', (table) => {
        table.unique('employee_code', 'idx_employees_employee_code_unique');
      });
    }
  } catch (idxErr) {
    console.warn('Note on unique index creation:', idxErr.message);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  try {
    await knex.schema.alterTable('employees', (table) => {
      table.dropUnique(['employee_code'], 'idx_employees_employee_code_unique');
    });
  } catch (e) {}
};
