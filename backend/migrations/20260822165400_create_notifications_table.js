/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('notifications'))) {
    await knex.schema.createTable('notifications', (table) => {
      table.increments('id').primary();
      table.integer('recipient_user_id').nullable(); // maps to employee user ID if applicable
      table.integer('recipient_employee_id').nullable(); // maps to employees.id
      table.string('role', 50).nullable();
      table.integer('team_id').nullable();
      table.string('type', 100).notNullable();
      table.string('title', 255).notNullable();
      table.text('message').nullable();
      table.string('entity_type', 100).nullable();
      table.string('entity_id', 100).nullable();
      table.string('action_url', 255).nullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notifications');
};
