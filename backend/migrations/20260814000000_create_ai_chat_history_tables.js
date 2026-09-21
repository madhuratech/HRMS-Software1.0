exports.up = function(knex) {
  return knex.schema
    .createTable('ai_conversations', function(table) {
      table.increments('id').primary();
      table.string('conversation_id', 255).unique().notNullable();
      table.integer('user_id').unsigned().nullable();
      table.string('title', 255).nullable();
      table.timestamps(true, true);
    })
    .createTable('ai_messages', function(table) {
      table.increments('id').primary();
      table.string('conversation_id', 255).notNullable();
      table.string('role', 50).notNullable();
      table.text('content').nullable();
      table.string('tool_name', 255).nullable();
      table.string('tool_call_id', 255).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index('conversation_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ai_messages')
    .dropTableIfExists('ai_conversations');
};
