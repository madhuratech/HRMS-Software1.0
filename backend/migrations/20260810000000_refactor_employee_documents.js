/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Drop the old employee_documents table if it doesn't have the new fields
  const hasExpiryDate = await knex.schema.hasColumn('employee_documents', 'expiry_date');
  if (hasExpiryDate) {
    return; // Already migrated
  }

  await knex.schema.dropTableIfExists('employee_documents');

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
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Safe fallback
};
