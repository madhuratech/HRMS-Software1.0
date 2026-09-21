/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('recruitment_sources');
  if (!hasTable) {
    await knex.schema.createTable('recruitment_sources', (table) => {
      table.increments('id').primary();
      table.string('source_name', 255).notNullable();
      table.text('description').nullable();
      table.enum('status', ['Active', 'Inactive']).defaultTo('Active');
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
  await knex.schema.dropTableIfExists('recruitment_sources');
};
