/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('roles'))) {
    await knex.schema.createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('name', 50).unique().nullable();
      table.string('role_key', 50).nullable();
      table.string('role_name', 100).nullable();
      table.text('description').nullable();
      table.boolean('is_system').defaultTo(true);
    });
  }

  if (!(await knex.schema.hasTable('permissions'))) {
    await knex.schema.createTable('permissions', (table) => {
      table.increments('id').primary();
      table.string('perm_code', 100).notNullable().unique();
      table.string('perm_name', 100).notNullable();
    });
  }

  if (!(await knex.schema.hasTable('role_permissions'))) {
    await knex.schema.createTable('role_permissions', (table) => {
      table.increments('id').primary();
      table.string('role_key', 50).notNullable();
      table.string('module_key', 50).notNullable();
      table.boolean('can_view').defaultTo(false);
      table.boolean('can_create').defaultTo(false);
      table.boolean('can_edit').defaultTo(false);
      table.boolean('can_delete').defaultTo(false);
      table.timestamps(true, true);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
};
