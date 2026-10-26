/**
 * Migration: Create Users Table
 * 
 * Ensures the `users` table exists in MySQL database with all necessary
 * authentication and identity columns, proper foreign keys referencing `employees`,
 * and defensive guards to avoid dropping or breaking any existing schemas.
 * 
 * Seeds default Super Admin user if not present.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasUsers = await knex.schema.hasTable('users');

  if (!hasUsers) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().nullable();
      table.string('full_name', 100).notNullable();
      table.string('email', 100).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('role', 50).notNullable().defaultTo('EMPLOYEE');
      table.tinyint('email_verified', 1).defaultTo(0);
      table.string('account_status', 50).defaultTo('Pending Verification');
      table.string('verification_code', 10).nullable();
      table.dateTime('verification_expires_at').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.dateTime('email_verified_at').nullable();

      table.foreign('employee_id')
        .references('id')
        .inTable('employees')
        .onDelete('SET NULL');

      table.index(['employee_id'], 'idx_users_employee_id');
    });
    console.log('✅ Created users table successfully.');
  } else {
    // If users table already exists, defensively check and add missing columns
    const columns = [
      { name: 'employee_id', type: (t) => t.integer('employee_id').unsigned().nullable() },
      { name: 'full_name', type: (t) => t.string('full_name', 100).notNullable().defaultTo('') },
      { name: 'email', type: (t) => t.string('email', 100).notNullable() },
      { name: 'password_hash', type: (t) => t.string('password_hash', 255).notNullable().defaultTo('') },
      { name: 'role', type: (t) => t.string('role', 50).notNullable().defaultTo('EMPLOYEE') },
      { name: 'email_verified', type: (t) => t.tinyint('email_verified', 1).defaultTo(0) },
      { name: 'account_status', type: (t) => t.string('account_status', 50).defaultTo('Pending Verification') },
      { name: 'verification_code', type: (t) => t.string('verification_code', 10).nullable() },
      { name: 'verification_expires_at', type: (t) => t.dateTime('verification_expires_at').nullable() },
      { name: 'created_at', type: (t) => t.timestamp('created_at').defaultTo(knex.fn.now()) },
      { name: 'updated_at', type: (t) => t.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')) },
      { name: 'email_verified_at', type: (t) => t.dateTime('email_verified_at').nullable() }
    ];

    for (const col of columns) {
      const hasCol = await knex.schema.hasColumn('users', col.name);
      if (!hasCol) {
        await knex.schema.alterTable('users', (table) => {
          col.type(table);
        });
        console.log(`✅ Added column ${col.name} to users table.`);
      }
    }
  }

  // Ensure default Super Admin account exists
  const adminEmail = 'madhuratechcbe@gmail.com';
  const adminUser = await knex('users')
    .whereRaw('LOWER(email) = ?', [adminEmail.toLowerCase()])
    .first();

  if (!adminUser) {
    await knex('users').insert({
      employee_id: null,
      full_name: 'Madhura Admin',
      email: adminEmail,
      password_hash: '$2b$10$TRbdpTmBmhi3SsNiUvTml.V06aOPcw5rkWn9oHr.5X4CcMT0qniFK', // Admin@123
      role: 'SUPER_ADMIN',
      email_verified: 1,
      account_status: 'Active',
      email_verified_at: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
    console.log('✅ Default Super Admin account verified/created in users table.');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('users');
};
