/**
 * Migration: Create clients table and add client_id FK to projects
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  // ---- clients table ----
  const hasClients = await knex.schema.hasTable('clients');
  if (!hasClients) {
    await knex.schema.createTable('clients', (table) => {
      table.increments('id').primary();
      table.string('client_code', 20).notNullable();
      table.string('company_name', 200).notNullable();
      table.string('contact_person', 150).nullable();
      table.string('designation', 100).nullable();
      table.string('email', 150).nullable();
      table.string('phone', 20).nullable();
      table.string('alternate_phone', 20).nullable();
      table.string('website', 200).nullable();
      table.string('industry', 100).nullable();
      table.string('company_size', 50).nullable();
      table.text('address').nullable();
      table.string('city', 100).nullable();
      table.string('state', 100).nullable();
      table.string('country', 100).nullable();
      table.string('postal_code', 20).nullable();
      table.enu('client_type', ['Prospect', 'Active', 'Inactive', 'Former']).defaultTo('Prospect');
      table.enu('status', ['Active', 'Inactive', 'Blocked']).defaultTo('Active');
      table.string('gst_number', 50).nullable();
      table.text('notes').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });

    // Add unique index on client_code
    await knex.schema.table('clients', (table) => {
      table.unique(['client_code']);
    });
  }

  // ---- Add client_id FK to projects (if not already present) ----
  const hasProjects = await knex.schema.hasTable('projects');
  if (hasProjects) {
    const hasClientId = await knex.schema.hasColumn('projects', 'client_id');
    if (!hasClientId) {
      await knex.schema.table('projects', (table) => {
        table.integer('client_id').nullable().references('id').inTable('clients').onDelete('SET NULL');
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
  // Remove client_id from projects first
  const hasProjects = await knex.schema.hasTable('projects');
  if (hasProjects) {
    const hasClientId = await knex.schema.hasColumn('projects', 'client_id');
    if (hasClientId) {
      await knex.schema.table('projects', (table) => {
        table.dropColumn('client_id');
      });
    }
  }
  await knex.schema.dropTableIfExists('clients');
};
