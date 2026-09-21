/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. promotions
  if (!(await knex.schema.hasTable('promotions'))) {
    await knex.schema.createTable('promotions', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('current_department', 255).notNullable();
      table.string('current_designation', 255).notNullable();
      table.string('promoted_department', 255).notNullable();
      table.string('promoted_designation', 255).notNullable();
      table.date('promotion_date').notNullable();
      table.date('effective_date').notNullable();
      table.text('promotion_reason').nullable();
      table.enum('status', ['Pending', 'Approved', 'Rejected']).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // 2. goals
  if (!(await knex.schema.hasTable('goals'))) {
    await knex.schema.createTable('goals', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('goal_title', 255).notNullable();
      table.string('goal_category', 255).defaultTo('General');
      table.text('goal_description').nullable();
      table.enum('priority', ['High', 'Medium', 'Low']).defaultTo('Medium');
      table.date('start_date').nullable();
      table.date('target_date').notNullable();
      table.integer('completion_percentage').defaultTo(0);
      table.string('status', 100).defaultTo('Not Started');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  } else {
    const hasGoalTitle = await knex.schema.hasColumn('goals', 'goal_title');
    if (!hasGoalTitle) {
      await knex.schema.alterTable('goals', (table) => {
        table.string('goal_title', 255).nullable();
        table.integer('department_id').nullable();
        table.string('goal_category', 255).defaultTo('General');
        table.text('goal_description').nullable();
        table.string('priority', 50).defaultTo('Medium');
        table.date('target_date').nullable();
        table.integer('completion_percentage').defaultTo(0);
        table.string('status', 100).defaultTo('Not Started');
        table.integer('created_by').nullable();
        table.integer('updated_by').nullable();
      });
    }
  }

  // 3. kpis
  if (!(await knex.schema.hasTable('kpis'))) {
    await knex.schema.createTable('kpis', (table) => {
      table.increments('id').primary();
      table.string('kpi_name', 255).notNullable();
      table.integer('department_id').notNullable();
      table.string('weightage', 100).nullable();
      table.string('target_value', 255).notNullable();
      table.text('description').nullable();
      table.string('status', 100).defaultTo('Active');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  } else {
    const hasKpiName = await knex.schema.hasColumn('kpis', 'kpi_name');
    if (!hasKpiName) {
      await knex.schema.alterTable('kpis', (table) => {
        table.string('kpi_name', 255).nullable();
        table.integer('department_id').nullable();
        table.text('description').nullable();
        table.string('status', 100).defaultTo('Active');
        table.integer('created_by').nullable();
        table.integer('updated_by').nullable();
      });
    }
  }

  // 4. kras
  if (!(await knex.schema.hasTable('kras'))) {
    await knex.schema.createTable('kras', (table) => {
      table.increments('id').primary();
      table.string('kra_title', 255).notNullable();
      table.integer('department_id').notNullable();
      table.string('role_id', 255).notNullable();
      table.string('weightage', 100).nullable();
      table.string('status', 100).defaultTo('Active');
      table.text('description').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  } else {
    const hasKraTitle = await knex.schema.hasColumn('kras', 'kra_title');
    if (!hasKraTitle) {
      await knex.schema.alterTable('kras', (table) => {
        table.string('kra_title', 255).nullable();
        table.integer('department_id').nullable();
        table.string('role_id', 255).nullable();
        table.string('weightage', 100).nullable();
        table.string('status', 100).defaultTo('Active');
        table.text('description').nullable();
        table.integer('created_by').nullable();
        table.integer('updated_by').nullable();
      });
    }
  }

  // 5. appraisals
  if (!(await knex.schema.hasTable('appraisals'))) {
    await knex.schema.createTable('appraisals', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.decimal('current_salary', 15, 2).notNullable();
      table.decimal('proposed_salary', 15, 2).notNullable();
      table.date('effective_date').notNullable();
      table.decimal('appraisal_percentage', 5, 2).nullable();
      table.text('remarks').nullable();
      table.string('status', 100).defaultTo('In Progress');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  } else {
    const hasCurrentSalary = await knex.schema.hasColumn('appraisals', 'current_salary');
    if (!hasCurrentSalary) {
      await knex.schema.alterTable('appraisals', (table) => {
        table.decimal('current_salary', 15, 2).nullable();
        table.decimal('proposed_salary', 15, 2).nullable();
        table.date('effective_date').nullable();
        table.decimal('appraisal_percentage', 5, 2).nullable();
        table.text('remarks').nullable();
        table.string('status', 100).defaultTo('In Progress');
        table.integer('created_by').nullable();
        table.integer('updated_by').nullable();
      });
    }
  }

  // 6. reviews
  if (!(await knex.schema.hasTable('reviews'))) {
    await knex.schema.createTable('reviews', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('review_period', 255).notNullable();
      table.string('reviewer_id', 255).notNullable();
      table.string('type', 255).notNullable();
      table.string('overall_rating', 100).nullable();
      table.text('strengths').nullable();
      table.text('improvement').nullable();
      table.text('goals').nullable();
      table.text('comments').nullable();
      table.string('status', 100).defaultTo('In Progress');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  } else {
    const hasReviewPeriod = await knex.schema.hasColumn('reviews', 'review_period');
    if (!hasReviewPeriod) {
      await knex.schema.alterTable('reviews', (table) => {
        table.string('review_period', 255).nullable();
        table.string('type', 255).nullable();
        table.string('overall_rating', 100).nullable();
        table.text('strengths').nullable();
        table.text('improvement').nullable();
        table.text('goals').nullable();
        table.string('status', 100).defaultTo('In Progress');
        table.integer('created_by').nullable();
        table.integer('updated_by').nullable();
      });
    }
  }

  // 7. feedbacks
  if (!(await knex.schema.hasTable('feedbacks'))) {
    await knex.schema.createTable('feedbacks', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('department_id').notNullable();
      table.string('feedback_type', 255).notNullable();
      table.integer('rating').defaultTo(5);
      table.string('subject', 255).nullable();
      table.text('comments').notNullable();
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
  await knex.schema.dropTableIfExists('feedbacks');
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('appraisals');
  await knex.schema.dropTableIfExists('kras');
  await knex.schema.dropTableIfExists('kpis');
  await knex.schema.dropTableIfExists('goals');
  await knex.schema.dropTableIfExists('promotions');
};
