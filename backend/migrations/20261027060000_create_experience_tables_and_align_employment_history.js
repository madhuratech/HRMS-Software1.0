/**
 * Knex migration: create candidate_experiences, employee_previous_experiences,
 * and ensure employment_history has change_type, old_value, new_value, effective_date.
 */
exports.up = async function (knex) {
  // 1. Align employment_history
  const hasEmploymentHistory = await knex.schema.hasTable('employment_history');
  if (hasEmploymentHistory) {
    const hasChangeType = await knex.schema.hasColumn('employment_history', 'change_type');
    if (!hasChangeType) {
      await knex.schema.alterTable('employment_history', function (table) {
        table.string('change_type', 100).notNullable().defaultTo('General');
      });
    }

    const hasOldValue = await knex.schema.hasColumn('employment_history', 'old_value');
    if (!hasOldValue) {
      await knex.schema.alterTable('employment_history', function (table) {
        table.string('old_value', 255).nullable();
      });
    }

    const hasNewValue = await knex.schema.hasColumn('employment_history', 'new_value');
    if (!hasNewValue) {
      await knex.schema.alterTable('employment_history', function (table) {
        table.string('new_value', 255).nullable();
      });
    }

    const hasEffectiveDate = await knex.schema.hasColumn('employment_history', 'effective_date');
    if (!hasEffectiveDate) {
      await knex.schema.alterTable('employment_history', function (table) {
        table.date('effective_date').nullable();
      });
    }
  }

  // 2. candidate_experiences
  const hasCandExp = await knex.schema.hasTable('candidate_experiences');
  if (!hasCandExp) {
    await knex.schema.createTable('candidate_experiences', function (table) {
      table.increments('id').primary();
      table.integer('candidate_id').unsigned().notNullable().index();
      table.string('company_name', 255).notNullable();
      table.string('designation', 255).notNullable();
      table.string('department', 255).nullable();
      table.string('employment_type', 50).notNullable().defaultTo('Full Time');
      table.date('start_date').notNullable();
      table.date('end_date').nullable();
      table.boolean('is_currently_working').defaultTo(false);
      table.integer('duration_months').nullable();
      table.string('company_location', 255).nullable();
      table.text('reason_for_leaving').nullable();
      table.text('job_description').nullable();
      table.decimal('last_drawn_ctc', 12, 2).nullable();
      table.string('reporting_manager', 255).nullable();
      table.string('reference_name', 255).nullable();
      table.string('reference_designation', 255).nullable();
      table.string('reference_contact', 255).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // 3. employee_previous_experiences
  const hasEmpExp = await knex.schema.hasTable('employee_previous_experiences');
  if (!hasEmpExp) {
    await knex.schema.createTable('employee_previous_experiences', function (table) {
      table.increments('id').primary();
      table.integer('employee_id').notNullable().index();
      table.integer('candidate_experience_id').unsigned().nullable().index();
      table.string('company_name', 255).notNullable();
      table.string('designation', 255).notNullable();
      table.string('department', 255).nullable();
      table.string('employment_type', 50).notNullable().defaultTo('Full Time');
      table.date('start_date').notNullable();
      table.date('end_date').nullable();
      table.boolean('is_currently_working').defaultTo(false);
      table.integer('duration_months').nullable();
      table.string('company_location', 255).nullable();
      table.text('reason_for_leaving').nullable();
      table.text('job_description').nullable();
      table.decimal('last_drawn_ctc', 12, 2).nullable();
      table.string('reporting_manager', 255).nullable();
      table.string('reference_name', 255).nullable();
      table.string('reference_designation', 255).nullable();
      table.string('reference_contact', 255).nullable();
      table.enu('verification_status', ['Pending', 'Verified', 'Rejected', 'Unable to Verify']).notNullable().defaultTo('Pending');
      table.text('verification_notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }
};

exports.down = async function (knex) {
  // Safe rollback if needed
};
