/**
 * Knex migration: ensure designations and departments have all required columns
 */
exports.up = async function (knex) {
  // 1. Align designations
  const hasDesignations = await knex.schema.hasTable('designations');
  if (hasDesignations) {
    await knex.schema.alterTable('designations', function (table) {
      // knex.schema.hasColumn checks in async
    });
    const hasRoleCode = await knex.schema.hasColumn('designations', 'role_code');
    if (!hasRoleCode) {
      await knex.schema.alterTable('designations', t => t.string('role_code', 50).nullable());
      await knex.raw('UPDATE designations SET role_code = designation_code WHERE role_code IS NULL');
    }
    const hasDept = await knex.schema.hasColumn('designations', 'department');
    if (!hasDept) {
      await knex.schema.alterTable('designations', t => t.string('department', 100).nullable());
    }
    const hasReportsTo = await knex.schema.hasColumn('designations', 'reportsTo');
    if (!hasReportsTo) {
      await knex.schema.alterTable('designations', t => t.string('reportsTo', 100).nullable());
    }
    const hasGrade = await knex.schema.hasColumn('designations', 'grade');
    if (!hasGrade) {
      await knex.schema.alterTable('designations', t => t.string('grade', 50).nullable());
    }
    const hasLevel = await knex.schema.hasColumn('designations', 'level');
    if (!hasLevel) {
      await knex.schema.alterTable('designations', t => t.string('level', 50).nullable());
    }
    const hasCreatedDate = await knex.schema.hasColumn('designations', 'createdDate');
    if (!hasCreatedDate) {
      await knex.schema.alterTable('designations', t => t.string('createdDate', 50).nullable());
    }
  }

  // 2. Align departments
  const hasDepartments = await knex.schema.hasTable('departments');
  if (hasDepartments) {
    const hasCode = await knex.schema.hasColumn('departments', 'code');
    if (!hasCode) {
      await knex.schema.alterTable('departments', t => t.string('code', 50).nullable());
      await knex.raw('UPDATE departments SET code = department_code WHERE code IS NULL');
    }
    const hasBranch = await knex.schema.hasColumn('departments', 'branch');
    if (!hasBranch) {
      await knex.schema.alterTable('departments', t => t.string('branch', 100).nullable());
    }
    const hasEmail = await knex.schema.hasColumn('departments', 'email');
    if (!hasEmail) {
      await knex.schema.alterTable('departments', t => t.string('email', 150).nullable());
    }
    const hasPhone = await knex.schema.hasColumn('departments', 'phone');
    if (!hasPhone) {
      await knex.schema.alterTable('departments', t => t.string('phone', 50).nullable());
    }
    const hasExt = await knex.schema.hasColumn('departments', 'extension');
    if (!hasExt) {
      await knex.schema.alterTable('departments', t => t.string('extension', 50).nullable());
    }
    const hasLoc = await knex.schema.hasColumn('departments', 'location');
    if (!hasLoc) {
      await knex.schema.alterTable('departments', t => t.string('location', 150).nullable());
    }
    const hasParent = await knex.schema.hasColumn('departments', 'parentDepartment');
    if (!hasParent) {
      await knex.schema.alterTable('departments', t => t.string('parentDepartment', 100).nullable());
    }
    const hasCreatedDateDept = await knex.schema.hasColumn('departments', 'createdDate');
    if (!hasCreatedDateDept) {
      await knex.schema.alterTable('departments', t => t.string('createdDate', 50).nullable());
    }
  }
};

exports.down = async function (knex) {
  // Safe no-op on rollback
};
