/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasExperience = await knex.schema.hasColumn('employees', 'experience');
  const hasShiftType = await knex.schema.hasColumn('employees', 'shift_type');

  await knex.schema.alterTable('employees', (table) => {
    if (!hasExperience) {
      table.string('experience', 100).nullable().defaultTo(null);
    }
    if (!hasShiftType) {
      table.string('shift_type', 100).nullable().defaultTo('Regular Shift');
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('employees', (table) => {
    table.dropColumn('experience');
    table.dropColumn('shift_type');
  });
};
