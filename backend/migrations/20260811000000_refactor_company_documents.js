/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.dropTableIfExists('company_documents');

  await knex.schema.createTable('company_documents', (table) => {
    table.increments('id').primary();
    table.integer('company_id').nullable();
    table.string('document_name', 255).notNullable();
    table.string('document_category', 100).notNullable();
    table.string('document_path', 500).notNullable();
    table.string('status', 30).defaultTo('Active');
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
  await knex.schema.dropTableIfExists('company_documents');
};
