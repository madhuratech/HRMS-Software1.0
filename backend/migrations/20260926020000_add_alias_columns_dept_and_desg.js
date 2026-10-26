/**
 * Migration: Align Department and Designation Column Names
 * 
 * Ensures `dept_name` exists in `departments` (synced with `department_name`)
 * and `role_name` exists in `designations` (synced with `designation_name`)
 * to maintain complete compatibility across all legacy and current queries.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. departments.dept_name
  const hasDepartments = await knex.schema.hasTable('departments');
  if (hasDepartments) {
    const hasDeptName = await knex.schema.hasColumn('departments', 'dept_name');
    if (!hasDeptName) {
      await knex.schema.alterTable('departments', (table) => {
        table.string('dept_name', 100).nullable();
      });
      await knex.raw('UPDATE departments SET dept_name = department_name WHERE dept_name IS NULL');
      console.log('✅ Added dept_name to departments table.');
    }
  }

  // 2. designations.role_name
  const hasDesignations = await knex.schema.hasTable('designations');
  if (hasDesignations) {
    const hasRoleName = await knex.schema.hasColumn('designations', 'role_name');
    if (!hasRoleName) {
      await knex.schema.alterTable('designations', (table) => {
        table.string('role_name', 100).nullable();
      });
      await knex.raw('UPDATE designations SET role_name = designation_name WHERE role_name IS NULL');
      console.log('✅ Added role_name to designations table.');
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Defensive down
};
