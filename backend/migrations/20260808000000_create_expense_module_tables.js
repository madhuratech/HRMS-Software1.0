/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // ---- expense_categories ----
  const hasCategories = await knex.schema.hasTable('expense_categories');
  if (!hasCategories) {
    await knex.schema.createTable('expense_categories', (table) => {
      table.increments('id').primary();
      table.string('name', 150).notNullable();
      table.text('description').nullable();
      table.string('status', 30).defaultTo('Active');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });

    // Seed default categories
    await knex('expense_categories').insert([
      { name: 'Travel', description: 'All travel related expenses', status: 'Active' },
      { name: 'Meals', description: 'Business meals and employee meals', status: 'Active' },
      { name: 'Accommodation', description: 'Hotel stays and lodging', status: 'Active' },
      { name: 'Office Supplies', description: 'Office supplies and stationery', status: 'Active' },
      { name: 'Client Entertainment', description: 'Entertainment with clients', status: 'Active' },
    ]);
  }

  // ---- expense_claims ----
  const hasClaims = await knex.schema.hasTable('expense_claims');
  if (!hasClaims) {
    await knex.schema.createTable('expense_claims', (table) => {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.integer('employee_id').notNullable();
      table.integer('category_id').notNullable();
      table.decimal('amount', 12, 2).notNullable();
      table.date('date').notNullable();
      table.string('payment_method', 100).defaultTo('Reimbursement');
      table.string('receipt', 500).nullable();
      table.text('description').nullable();
      table.string('status', 30).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ---- reimbursements ----
  const hasReimbursements = await knex.schema.hasTable('reimbursements');
  if (!hasReimbursements) {
    await knex.schema.createTable('reimbursements', (table) => {
      table.increments('id').primary();
      table.integer('claim_id').notNullable();
      table.string('payment_method', 100).defaultTo('Bank Transfer');
      table.string('transaction_id', 150).nullable();
      table.date('paid_date').nullable();
      table.string('status', 30).defaultTo('Pending');
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
  await knex.schema.dropTableIfExists('reimbursements');
  await knex.schema.dropTableIfExists('expense_claims');
  await knex.schema.dropTableIfExists('expense_categories');
};
