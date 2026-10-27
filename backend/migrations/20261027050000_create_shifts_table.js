/**
 * Knex migration: create shifts table if it doesn't already exist
 */
exports.up = async function (knex) {
  const hasShifts = await knex.schema.hasTable('shifts');
  if (!hasShifts) {
    await knex.schema.createTable('shifts', function (table) {
      table.increments('id').primary();
      table.string('shift_name', 100).notNullable();
      table.time('start_time').notNullable();
      table.time('end_time').notNullable();
      table.integer('grace_time').defaultTo(15);
      table.string('shift_type', 50).defaultTo('Morning');
      table.string('color', 20).defaultTo('#3B82F6');
      table.string('status', 50).defaultTo('Active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('shifts');
};
