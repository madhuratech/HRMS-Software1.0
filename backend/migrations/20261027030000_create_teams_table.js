/**
 * Knex migration: create teams table if it doesn't already exist
 */
exports.up = async function (knex) {
  const hasTeams = await knex.schema.hasTable('teams');
  if (!hasTeams) {
    await knex.schema.createTable('teams', function (table) {
      table.increments('id').primary();
      table.string('name', 150).notNullable();
      table.string('code', 50).nullable();
      table.string('department', 100).nullable();
      table.integer('department_id').unsigned().nullable();
      table.string('teamLead', 150).nullable();
      table.integer('team_lead_id').unsigned().nullable();
      table.integer('members').defaultTo(0);
      table.string('status', 50).defaultTo('Active');
      table.text('description').nullable();
      table.string('createdDate', 50).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('teams');
};
