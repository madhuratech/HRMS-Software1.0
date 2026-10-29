/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasPerfEval = await knex.schema.hasTable('performance_evaluations');
  if (!hasPerfEval) {
    await knex.schema.createTable('performance_evaluations', (table) => {
      table.increments('id').primary();
      table.integer('review_id').notNullable().index();
      table.integer('employee_id').notNullable().index();
      table.integer('goal_id').nullable();
      table.integer('kra_id').nullable();
      table.integer('kpi_id').nullable();
      table.string('kra_title_snapshot', 255).nullable();
      table.decimal('kra_weightage_snapshot', 5, 2).defaultTo(0.00);
      table.string('kpi_name_snapshot', 255).nullable();
      table.string('measurement_type_snapshot', 50).defaultTo('Number');
      table.decimal('target_value_snapshot', 10, 2).defaultTo(0.00);
      table.decimal('actual_achievement', 10, 2).defaultTo(0.00);
      table.decimal('achievement_percentage', 5, 2).defaultTo(0.00);
      table.decimal('weighted_score', 5, 2).defaultTo(0.00);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
    console.log('Created performance_evaluations table successfully.');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('performance_evaluations');
};

