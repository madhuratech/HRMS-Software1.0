/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create requirements table
  const hasRequirements = await knex.schema.hasTable('requirements');
  if (!hasRequirements) {
    await knex.schema.createTable('requirements', (table) => {
      table.increments('id').primary();
      table.string('requirement_code', 50).unique().notNullable();
      table.string('job_title', 255).notNullable();
      table.integer('department_id').notNullable();
      table.integer('designation_id').notNullable();
      table.enum('employment_type', ['Full Time', 'Part Time', 'Contract', 'Internship', 'Temporary', 'Freelancer', 'Remote', 'Hybrid']).notNullable();
      table.integer('vacancies').notNullable();
      table.enum('priority', ['Low', 'Medium', 'High', 'Critical']).notNullable();
      table.integer('experience_from').notNullable();
      table.integer('experience_to').notNullable();
      table.decimal('salary_from', 15, 2).nullable();
      table.decimal('salary_to', 15, 2).nullable();
      table.string('location', 255).nullable();
      table.string('work_mode', 100).nullable();
      table.string('education', 255).nullable();
      table.text('skills').nullable();
      table.text('job_description').nullable();
      table.text('responsibilities').nullable();
      table.text('requirements').nullable();
      table.integer('hiring_manager').nullable();
      table.integer('requested_by').nullable();
      table.date('opening_date').notNullable();
      table.date('closing_date').notNullable();
      table.enum('status', ['Draft', 'Pending', 'Approved', 'Rejected', 'Open', 'On Hold', 'Closed', 'Cancelled', 'Filled']).defaultTo('Draft');
      table.enum('approval_status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
      table.text('remarks').nullable();
      table.string('attachment', 500).nullable();
      table.integer('company_id').nullable();
      table.integer('branch_id').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.integer('deleted_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.timestamp('deleted_at').nullable();
    });
  }

  // Create requirement_audit_logs table
  const hasAuditLogs = await knex.schema.hasTable('requirement_audit_logs');
  if (!hasAuditLogs) {
    await knex.schema.createTable('requirement_audit_logs', (table) => {
      table.increments('id').primary();
      table.integer('requirement_id').notNullable();
      table.string('action', 50).notNullable();
      table.string('status_from', 50).nullable();
      table.string('status_to', 50).nullable();
      table.integer('performed_by').notNullable();
      table.text('remarks').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('requirement_audit_logs');
  await knex.schema.dropTableIfExists('requirements');
};
