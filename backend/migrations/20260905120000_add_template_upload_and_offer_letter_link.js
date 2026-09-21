/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Update document_templates
  const hasTemplates = await knex.schema.hasTable('document_templates');
  if (hasTemplates) {
    const hasDesc = await knex.schema.hasColumn('document_templates', 'description');
    const hasSourceType = await knex.schema.hasColumn('document_templates', 'template_source_type');
    const hasFileName = await knex.schema.hasColumn('document_templates', 'original_file_name');
    const hasFilePath = await knex.schema.hasColumn('document_templates', 'file_path');
    const hasFileType = await knex.schema.hasColumn('document_templates', 'file_type');
    const hasFileSize = await knex.schema.hasColumn('document_templates', 'file_size');

    await knex.schema.alterTable('document_templates', (table) => {
      if (!hasDesc) table.text('description').nullable();
      if (!hasSourceType) table.string('template_source_type', 50).defaultTo('editor');
      if (!hasFileName) table.string('original_file_name', 255).nullable();
      if (!hasFilePath) table.string('file_path', 500).nullable();
      if (!hasFileType) table.string('file_type', 100).nullable();
      if (!hasFileSize) table.bigInteger('file_size').nullable();
    });
  }

  // Update offer_letters
  const hasOffers = await knex.schema.hasTable('offer_letters');
  if (hasOffers) {
    const hasCandId = await knex.schema.hasColumn('offer_letters', 'candidate_id');
    const hasTplId = await knex.schema.hasColumn('offer_letters', 'template_id');
    const hasSnapshot = await knex.schema.hasColumn('offer_letters', 'template_snapshot');
    const hasOfferDate = await knex.schema.hasColumn('offer_letters', 'offer_date');

    await knex.schema.alterTable('offer_letters', (table) => {
      if (!hasCandId) table.integer('candidate_id').nullable();
      if (!hasTplId) table.integer('template_id').nullable();
      if (!hasSnapshot) table.text('template_snapshot', 'longtext').nullable();
      if (!hasOfferDate) table.date('offer_date').nullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTemplates = await knex.schema.hasTable('document_templates');
  if (hasTemplates) {
    await knex.schema.alterTable('document_templates', (table) => {
      table.dropColumn('description');
      table.dropColumn('template_source_type');
      table.dropColumn('original_file_name');
      table.dropColumn('file_path');
      table.dropColumn('file_type');
      table.dropColumn('file_size');
    });
  }

  const hasOffers = await knex.schema.hasTable('offer_letters');
  if (hasOffers) {
    await knex.schema.alterTable('offer_letters', (table) => {
      table.dropColumn('candidate_id');
      table.dropColumn('template_id');
      table.dropColumn('template_snapshot');
      table.dropColumn('offer_date');
    });
  }
};
