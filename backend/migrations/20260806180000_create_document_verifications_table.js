/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('document_verifications');
  if (!hasTable) {
    await knex.schema.createTable('document_verifications', (table) => {
      table.increments('id').primary();
      table.integer('new_joiner_id').notNullable();
      table.string('aadhaar_card', 500).nullable();
      table.string('pan_card', 500).nullable();
      table.string('resume', 500).nullable();
      table.string('passport', 500).nullable();
      table.string('degree_certificate', 500).nullable();
      table.string('experience_certificate', 500).nullable();
      table.string('relieving_letter', 500).nullable();
      table.string('photo', 500).nullable();
      table.string('bank_passbook', 500).nullable();
      table.string('driving_license', 500).nullable();
      table.enum('status', ['Pending', 'Verified', 'Rejected', 'Completed']).defaultTo('Pending');
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
  await knex.schema.dropTableIfExists('document_verifications');
};
