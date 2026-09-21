/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Update requirements status enum to include 'Published'
  await knex.raw(`
    ALTER TABLE requirements 
    MODIFY COLUMN status ENUM('Draft', 'Open', 'Published', 'Closed', 'On Hold', 'Cancelled', 'Filled') 
    DEFAULT 'Open'
  `);

  // 2. Ensure job_publishings status column supports VARCHAR(50)
  const hasJobPublishings = await knex.schema.hasTable('job_publishings');
  if (hasJobPublishings) {
    await knex.raw(`
      ALTER TABLE job_publishings 
      MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
    `);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(`
    ALTER TABLE requirements 
    MODIFY COLUMN status ENUM('Draft', 'Open', 'Closed', 'On Hold', 'Cancelled', 'Filled') 
    DEFAULT 'Open'
  `);
};
