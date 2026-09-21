/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasAssetsTable = await knex.schema.hasTable('assets');
  if (!hasAssetsTable) {
    await knex.schema.createTable('assets', (table) => {
      table.increments('id').primary();
      table.string('asset_name', 255).notNullable();
      table.enum('asset_type', ['Laptop', 'Monitor', 'Mobile', 'Peripheral', 'Tablet']).defaultTo('Laptop');
      table.string('serial_number', 100).notNullable().unique();
      table.enum('status', ['Available', 'Allocated']).defaultTo('Available');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });

    // Seed some initial assets
    await knex('assets').insert([
      { asset_name: 'MacBook Pro 16 M3', asset_type: 'Laptop', serial_number: 'C02G1234MD6R', status: 'Available' },
      { asset_name: 'Dell UltraSharp 27 Monitor', asset_type: 'Monitor', serial_number: 'CN012345XYZ6', status: 'Available' },
      { asset_name: 'iMac 24 M3', asset_type: 'Laptop', serial_number: 'C02H5678MD9T', status: 'Available' },
      { asset_name: 'Lenovo ThinkPad X1 Carbon', asset_type: 'Laptop', serial_number: 'PF1234567890', status: 'Available' },
      { asset_name: 'iPhone 15 Pro', asset_type: 'Mobile', serial_number: 'G9912345XYZ0', status: 'Available' },
      { asset_name: 'iPad Pro 11', asset_type: 'Tablet', serial_number: 'DL1234567XYZ', status: 'Available' },
      { asset_name: 'Logitech MX Master 3S', asset_type: 'Peripheral', serial_number: 'LZ1234567XYZ', status: 'Available' }
    ]);
  }

  const hasAllocationsTable = await knex.schema.hasTable('asset_allocations');
  if (!hasAllocationsTable) {
    await knex.schema.createTable('asset_allocations', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('asset_id').notNullable();
      table.date('allocation_date').notNullable();
      table.string('assigned_by', 255).notNullable();
      table.enum('status', ['Allocated', 'Pending', 'Returned']).defaultTo('Allocated');
      table.text('description').nullable();
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
  await knex.schema.dropTableIfExists('asset_allocations');
  await knex.schema.dropTableIfExists('assets');
};
