/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Add ATS and evaluation columns to candidates table if missing
  const hasCandidates = await knex.schema.hasTable('candidates');
  if (hasCandidates) {
    const hasRequirementId = await knex.schema.hasColumn('candidates', 'requirement_id');
    const hasAtsScore = await knex.schema.hasColumn('candidates', 'ats_score');
    const hasAtsBreakdown = await knex.schema.hasColumn('candidates', 'ats_breakdown');
    const hasScreeningScore = await knex.schema.hasColumn('candidates', 'screening_score');
    const hasScreeningAnswers = await knex.schema.hasColumn('candidates', 'screening_answers');
    const hasEvaluationStatus = await knex.schema.hasColumn('candidates', 'evaluation_status');
    const hasEvaluatedAt = await knex.schema.hasColumn('candidates', 'evaluated_at');
    const hasEvaluatedBy = await knex.schema.hasColumn('candidates', 'evaluated_by');
    const hasEvaluationNotes = await knex.schema.hasColumn('candidates', 'evaluation_notes');

    await knex.schema.alterTable('candidates', (table) => {
      if (!hasRequirementId) table.integer('requirement_id').nullable();
      if (!hasAtsScore) table.decimal('ats_score', 5, 2).defaultTo(0);
      if (!hasAtsBreakdown) table.text('ats_breakdown').nullable();
      if (!hasScreeningScore) table.decimal('screening_score', 5, 2).defaultTo(0);
      if (!hasScreeningAnswers) table.text('screening_answers').nullable();
      if (!hasEvaluationStatus) table.string('evaluation_status', 50).defaultTo('PENDING');
      if (!hasEvaluatedAt) table.timestamp('evaluated_at').nullable();
      if (!hasEvaluatedBy) table.integer('evaluated_by').nullable();
      if (!hasEvaluationNotes) table.text('evaluation_notes').nullable();
    });
  }

  // 2. Create candidate_applications table for job-specific candidate tracking
  const hasApplications = await knex.schema.hasTable('candidate_applications');
  if (!hasApplications) {
    await knex.schema.createTable('candidate_applications', (table) => {
      table.increments('id').primary();
      table.integer('candidate_id').notNullable();
      table.integer('requirement_id').notNullable();
      table.string('job_position', 255).notNullable();
      table.string('status', 50).defaultTo('Applied');
      table.decimal('ats_score', 5, 2).defaultTo(0);
      table.text('ats_breakdown').nullable();
      table.decimal('screening_score', 5, 2).defaultTo(0);
      table.text('screening_answers').nullable();
      table.string('evaluation_status', 50).defaultTo('PENDING');
      table.timestamp('evaluated_at').nullable();
      table.integer('evaluated_by').nullable();
      table.text('evaluation_notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));

      table.index(['candidate_id', 'requirement_id']);
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('candidate_applications');
  const hasCandidates = await knex.schema.hasTable('candidates');
  if (hasCandidates) {
    await knex.schema.alterTable('candidates', (table) => {
      table.dropColumn('requirement_id');
      table.dropColumn('ats_score');
      table.dropColumn('ats_breakdown');
      table.dropColumn('screening_score');
      table.dropColumn('screening_answers');
      table.dropColumn('evaluation_status');
      table.dropColumn('evaluated_at');
      table.dropColumn('evaluated_by');
      table.dropColumn('evaluation_notes');
    });
  }
};
