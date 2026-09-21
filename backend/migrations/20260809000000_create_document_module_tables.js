/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // ---- employee_documents ----
  const hasEmpDocs = await knex.schema.hasTable('employee_documents');
  if (!hasEmpDocs) {
    await knex.schema.createTable('employee_documents', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('document_type', 100).notNullable();
      table.string('document_name', 255).notNullable();
      table.date('expiry_date').nullable();
      table.string('file', 500).nullable();
      table.string('status', 30).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- company_documents ----
  const hasCompanyDocs = await knex.schema.hasTable('company_documents');
  if (!hasCompanyDocs) {
    await knex.schema.createTable('company_documents', (table) => {
      table.increments('id').primary();
      table.string('document_name', 255).notNullable();
      table.string('category', 100).notNullable();
      table.string('department', 100).nullable();
      table.string('file', 500).nullable();
      table.string('size', 50).nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- hr_policies ----
  const hasPolicies = await knex.schema.hasTable('hr_policies');
  if (!hasPolicies) {
    await knex.schema.createTable('hr_policies', (table) => {
      table.increments('id').primary();
      table.string('policy_name', 255).notNullable();
      table.string('category', 100).notNullable();
      table.string('version', 30).defaultTo('1.0');
      table.date('effective_date').nullable();
      table.string('file', 500).nullable();
      table.string('status', 30).defaultTo('Draft');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- document_templates ----
  const hasTemplates = await knex.schema.hasTable('document_templates');
  if (!hasTemplates) {
    await knex.schema.createTable('document_templates', (table) => {
      table.increments('id').primary();
      table.string('template_name', 255).notNullable();
      table.string('category', 100).notNullable();
      table.text('content').nullable();
      table.string('status', 30).defaultTo('Active');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- digital_signatures ----
  const hasSignatures = await knex.schema.hasTable('digital_signatures');
  if (!hasSignatures) {
    await knex.schema.createTable('digital_signatures', (table) => {
      table.increments('id').primary();
      table.string('doc_name', 255).notNullable();
      table.string('requested_by', 150).nullable();
      table.string('requested_to', 150).nullable();
      table.date('date').nullable();
      table.date('expiry_date').nullable();
      table.string('file', 500).nullable();
      table.string('status', 30).defaultTo('Pending');
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
  await knex.schema.dropTableIfExists('digital_signatures');
  await knex.schema.dropTableIfExists('document_templates');
  await knex.schema.dropTableIfExists('hr_policies');
  await knex.schema.dropTableIfExists('company_documents');
  await knex.schema.dropTableIfExists('employee_documents');
};
