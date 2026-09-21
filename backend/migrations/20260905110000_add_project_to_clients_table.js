/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasClients = await knex.schema.hasTable('clients');
  if (hasClients) {
    const hasProject = await knex.schema.hasColumn('clients', 'project');
    if (!hasProject) {
      await knex.schema.alterTable('clients', (table) => {
        table.string('project', 200).nullable().defaultTo(null).after('company_name');
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasClients = await knex.schema.hasTable('clients');
  if (hasClients) {
    const hasProject = await knex.schema.hasColumn('clients', 'project');
    if (hasProject) {
      await knex.schema.alterTable('clients', (table) => {
        table.dropColumn('project');
      });
    }
  }
};
