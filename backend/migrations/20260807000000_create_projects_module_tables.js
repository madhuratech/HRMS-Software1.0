/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Drop empty legacy tables that no longer match the Projects module UI schema.
  // Note: legacy `tasks` table had a FK referencing `projects`, so drop tasks first.
  const hasLegacyTasks = await knex.schema.hasTable('tasks');
  if (hasLegacyTasks) {
    const legacyTasksCount = await knex('tasks').count({ c: '*' }).first();
    if (parseInt(legacyTasksCount.c) === 0) {
      await knex.schema.dropTableIfExists('tasks');
    }
  }
  const hasLegacyProjects = await knex.schema.hasTable('projects');
  if (hasLegacyProjects) {
    const legacyProjectsCount = await knex('projects').count({ c: '*' }).first();
    if (parseInt(legacyProjectsCount.c) === 0) {
      await knex.schema.dropTableIfExists('projects');
    }
  }

  // ---- projects ----
  const hasProjects = await knex.schema.hasTable('projects');
  if (!hasProjects) {
    await knex.schema.createTable('projects', (table) => {
      table.increments('id').primary();
      table.string('project_name', 150).notNullable();
      table.string('project_code', 50).notNullable();
      table.string('client', 150).nullable();
      table.integer('project_manager_id').nullable();
      table.date('start_date').nullable();
      table.date('end_date').nullable();
      table.decimal('budget', 14, 2).nullable();
      table.string('priority', 20).defaultTo('Medium');
      table.string('status', 30).defaultTo('In Progress');
      table.text('description').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- tasks ----
  const hasTasks = await knex.schema.hasTable('tasks');
  if (!hasTasks) {
    await knex.schema.createTable('tasks', (table) => {
      table.increments('id').primary();
      table.integer('project_id').notNullable();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.integer('assignee_id').nullable();
      table.date('start_date').nullable();
      table.date('due_date').nullable();
      table.string('priority', 30).defaultTo('Medium');
      table.string('status', 30).defaultTo('To Do');
      table.string('label', 50).nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- sprints ----
  const hasSprints = await knex.schema.hasTable('sprints');
  if (!hasSprints) {
    await knex.schema.createTable('sprints', (table) => {
      table.increments('id').primary();
      table.string('name', 150).notNullable();
      table.text('goal').nullable();
      table.integer('project_id').nullable();
      table.date('start_date').nullable();
      table.date('end_date').nullable();
      table.string('status', 30).defaultTo('Planning');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- timesheets ----
  const hasTimesheets = await knex.schema.hasTable('timesheets');
  if (!hasTimesheets) {
    await knex.schema.createTable('timesheets', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('project_id').notNullable();
      table.date('log_date').nullable();
      table.decimal('hours', 5, 2).notNullable();
      table.string('billable', 30).defaultTo('Billable');
      table.string('status', 30).defaultTo('Pending');
      table.text('task_description').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- milestones ----
  const hasMilestones = await knex.schema.hasTable('milestones');
  if (!hasMilestones) {
    await knex.schema.createTable('milestones', (table) => {
      table.increments('id').primary();
      table.string('milestone_name', 255).notNullable();
      table.integer('project_id').notNullable();
      table.date('due_date').notNullable();
      table.text('description').nullable();
      table.string('status', 30).defaultTo('Upcoming');
      table.integer('progress_pct').defaultTo(0);
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- project_team_members ----
  const hasTeamMembers = await knex.schema.hasTable('project_team_members');
  if (!hasTeamMembers) {
    await knex.schema.createTable('project_team_members', (table) => {
      table.increments('id').primary();
      table.integer('project_id').notNullable();
      table.integer('employee_id').notNullable();
      table.string('role', 100).defaultTo('Team Member');
      table.string('status', 30).defaultTo('Active');
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
  await knex.schema.dropTableIfExists('project_team_members');
  await knex.schema.dropTableIfExists('milestones');
  await knex.schema.dropTableIfExists('timesheets');
  await knex.schema.dropTableIfExists('sprints');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('projects');
};