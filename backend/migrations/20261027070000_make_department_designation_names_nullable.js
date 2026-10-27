/**
 * Knex migration: ensure legacy department_name and designation_name columns are nullable with default empty string
 */
exports.up = async function (knex) {
  const hasDepartments = await knex.schema.hasTable('departments');
  if (hasDepartments) {
    const hasDeptName = await knex.schema.hasColumn('departments', 'department_name');
    if (hasDeptName) {
      await knex.raw("ALTER TABLE departments MODIFY COLUMN department_name VARCHAR(255) NULL DEFAULT ''");
    }
  }

  const hasDesignations = await knex.schema.hasTable('designations');
  if (hasDesignations) {
    const hasDesgName = await knex.schema.hasColumn('designations', 'designation_name');
    if (hasDesgName) {
      await knex.raw("ALTER TABLE designations MODIFY COLUMN designation_name VARCHAR(100) NULL DEFAULT ''");
    }
  }
};

exports.down = async function (knex) {
  // Safe rollback
};
