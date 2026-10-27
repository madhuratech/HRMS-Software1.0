/**
 * Knex migration: create holidays table if it doesn't already exist
 */
exports.up = async function (knex) {
  const hasHolidays = await knex.schema.hasTable('holidays');
  if (!hasHolidays) {
    await knex.schema.createTable('holidays', function (table) {
      table.increments('id').primary();
      table.string('name', 150).notNullable();
      table.string('date', 100).nullable();
      table.date('holiday_date').nullable();
      table.string('type', 50).defaultTo('National');
      table.string('branch', 100).defaultTo('All Branches');
      table.text('description').nullable();
      table.string('status', 50).defaultTo('Active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('holidays');
};
