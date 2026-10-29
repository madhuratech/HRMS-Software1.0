/**
 * Knex migration: add missing resume and skills columns to candidate_applications and candidates tables
 */
exports.up = async function (knex) {
  // 1. Alter candidate_applications
  const hasAppTable = await knex.schema.hasTable('candidate_applications');
  if (hasAppTable) {
    const checkAndAddAppCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('candidate_applications', colName);
      if (!hasCol) {
        await knex.schema.alterTable('candidate_applications', callback);
      }
    };

    await checkAndAddAppCol('original_resume_name', t => t.string('original_resume_name', 255).nullable());
    await checkAndAddAppCol('resume', t => t.string('resume', 500).nullable());
    await checkAndAddAppCol('original_resume', t => t.string('original_resume', 500).nullable());
    await checkAndAddAppCol('generated_resume', t => t.string('generated_resume', 500).nullable());
    await checkAndAddAppCol('extracted_skills', t => t.text('extracted_skills').nullable());
    await checkAndAddAppCol('resume_text', t => t.text('resume_text', 'longtext').nullable());
    await checkAndAddAppCol('skills', t => t.text('skills').nullable());
  }

  // 2. Alter candidates
  const hasCandTable = await knex.schema.hasTable('candidates');
  if (hasCandTable) {
    const checkAndAddCandCol = async (colName, callback) => {
      const hasCol = await knex.schema.hasColumn('candidates', colName);
      if (!hasCol) {
        await knex.schema.alterTable('candidates', callback);
      }
    };

    await checkAndAddCandCol('original_resume_name', t => t.string('original_resume_name', 255).nullable());
    await checkAndAddCandCol('original_resume', t => t.string('original_resume', 500).nullable());
    await checkAndAddCandCol('generated_resume', t => t.string('generated_resume', 500).nullable());
    await checkAndAddCandCol('extracted_skills', t => t.text('extracted_skills').nullable());
    await checkAndAddCandCol('resume_text', t => t.text('resume_text', 'longtext').nullable());
    await checkAndAddCandCol('source_id', t => t.integer('source_id').nullable());
  }
};

exports.down = async function (knex) {
  const hasAppTable = await knex.schema.hasTable('candidate_applications');
  if (hasAppTable) {
    const cols = ['original_resume_name', 'resume', 'original_resume', 'generated_resume', 'extracted_skills', 'resume_text', 'skills'];
    for (const c of cols) {
      const hasCol = await knex.schema.hasColumn('candidate_applications', c);
      if (hasCol) {
        await knex.schema.alterTable('candidate_applications', t => t.dropColumn(c));
      }
    }
  }

  const hasCandTable = await knex.schema.hasTable('candidates');
  if (hasCandTable) {
    const cols = ['original_resume_name', 'original_resume', 'generated_resume', 'extracted_skills', 'resume_text', 'source_id'];
    for (const c of cols) {
      const hasCol = await knex.schema.hasColumn('candidates', c);
      if (hasCol) {
        await knex.schema.alterTable('candidates', t => t.dropColumn(c));
      }
    }
  }
};

