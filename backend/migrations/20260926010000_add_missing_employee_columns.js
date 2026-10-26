/**
 * Migration: Align Employees Schema with Application Identity & Auth Requirements
 * 
 * Adds missing columns to `employees` table that are queried by IdentityService,
 * authController, and employee management routes (profile_photo, team_id, manager_id,
 * bank_details, emergency_contact, address, candidate_id, verification_token,
 * experience_type, total_experience_years, total_experience_months,
 * relevant_experience_years, relevant_experience_months).
 * 
 * All additions use hasColumn guards so they are completely safe and idempotent.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasEmployees = await knex.schema.hasTable('employees');
  if (!hasEmployees) return;

  const columnsToAdd = [
    { name: 'candidate_id', apply: (t) => t.integer('candidate_id').nullable() },
    { name: 'profile_photo', apply: (t) => t.specificType('profile_photo', 'longtext').nullable() },
    { name: 'team_id', apply: (t) => t.integer('team_id').nullable() },
    { name: 'manager_id', apply: (t) => t.integer('manager_id').nullable() },
    { name: 'bank_details', apply: (t) => t.text('bank_details').nullable() },
    { name: 'emergency_contact', apply: (t) => t.string('emergency_contact', 100).nullable() },
    { name: 'address', apply: (t) => t.text('address').nullable() },
    { name: 'verification_token', apply: (t) => t.string('verification_token', 255).nullable() },
    { name: 'experience_type', apply: (t) => t.string('experience_type', 50).defaultTo('Experienced') },
    { name: 'total_experience_years', apply: (t) => t.integer('total_experience_years').defaultTo(0) },
    { name: 'total_experience_months', apply: (t) => t.integer('total_experience_months').defaultTo(0) },
    { name: 'relevant_experience_years', apply: (t) => t.integer('relevant_experience_years').defaultTo(0) },
    { name: 'relevant_experience_months', apply: (t) => t.integer('relevant_experience_months').defaultTo(0) }
  ];

  for (const col of columnsToAdd) {
    const exists = await knex.schema.hasColumn('employees', col.name);
    if (!exists) {
      await knex.schema.alterTable('employees', (table) => {
        col.apply(table);
      });
      console.log(`✅ Added column ${col.name} to employees table.`);
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Defensive down - do not drop data columns in production
};
