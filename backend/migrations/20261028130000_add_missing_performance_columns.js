/**
 * Knex migration: add missing columns to performance tables (goals, kpis, kras, reviews, appraisals, and feedback table)
 */
exports.up = async function (knex) {
  // 1. goals
  const hasGoals = await knex.schema.hasTable('goals');
  if (hasGoals) {
    const checkAndAddGoalCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('goals', colName);
      if (!hasCol) {
        await knex.schema.alterTable('goals', callback);
      }
    };
    await checkAndAddGoalCol('department_id', t => t.integer('department_id').nullable());
    await checkAndAddGoalCol('title', t => t.string('title', 255).nullable());
    await checkAndAddGoalCol('description', t => t.text('description').nullable());
    await checkAndAddGoalCol('due_date', t => t.date('due_date').nullable());
    await checkAndAddGoalCol('progress', t => t.integer('progress').defaultTo(0));
  }

  // 2. kpis
  const hasKpis = await knex.schema.hasTable('kpis');
  if (hasKpis) {
    const checkAndAddKpiCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('kpis', colName);
      if (!hasCol) {
        await knex.schema.alterTable('kpis', callback);
      }
    };
    await checkAndAddKpiCol('employee_id', t => t.integer('employee_id').nullable());
    await checkAndAddKpiCol('kra_id', t => t.integer('kra_id').nullable());
    await checkAndAddKpiCol('title', t => t.string('title', 255).nullable());
    await checkAndAddKpiCol('achieved_value', t => t.string('achieved_value', 100).nullable());
    await checkAndAddKpiCol('measurement_type', t => t.string('measurement_type', 50).defaultTo('Percentage'));
  }

  // 3. kras
  const hasKras = await knex.schema.hasTable('kras');
  if (hasKras) {
    const checkAndAddKraCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('kras', colName);
      if (!hasCol) {
        await knex.schema.alterTable('kras', callback);
      }
    };
    await checkAndAddKraCol('employee_id', t => t.integer('employee_id').nullable());
    await checkAndAddKraCol('goal_id', t => t.integer('goal_id').nullable());
    await checkAndAddKraCol('title', t => t.string('title', 255).nullable());
  }

  // 4. reviews
  const hasReviews = await knex.schema.hasTable('reviews');
  if (hasReviews) {
    const checkAndAddRevCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('reviews', colName);
      if (!hasCol) {
        await knex.schema.alterTable('reviews', callback);
      }
    };
    await checkAndAddRevCol('goal_id', t => t.integer('goal_id').nullable());
    await checkAndAddRevCol('review_date', t => t.date('review_date').nullable());
    await checkAndAddRevCol('rating', t => t.integer('rating').nullable());
    await checkAndAddRevCol('final_score', t => t.decimal('final_score', 5, 2).nullable());
    await checkAndAddRevCol('total_weightage', t => t.decimal('total_weightage', 5, 2).nullable());
  }

  // 5. appraisals
  const hasAppraisals = await knex.schema.hasTable('appraisals');
  if (hasAppraisals) {
    const checkAndAddApprCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('appraisals', colName);
      if (!hasCol) {
        await knex.schema.alterTable('appraisals', callback);
      }
    };
    await checkAndAddApprCol('appraisal_cycle', t => t.string('appraisal_cycle', 100).nullable());
    await checkAndAddApprCol('rating', t => t.decimal('rating', 3, 2).nullable());
    await checkAndAddApprCol('feedback', t => t.text('feedback').nullable());
  }

  // 6. feedback table
  const hasFeedback = await knex.schema.hasTable('feedback');
  if (!hasFeedback) {
    await knex.schema.createTable('feedback', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('provider_id').nullable();
      table.text('feedback_text').nullable();
      table.enu('feedback_type', ['positive', 'constructive']).defaultTo('positive');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }
};

exports.down = async function (knex) {
  // Rollback logic
};

