/**
 * Migration: Complete Payroll Workflow Schema Enhancements
 */
exports.up = async function (knex) {
  // 1. Create salary_structure_components table
  const hasStructComp = await knex.schema.hasTable('salary_structure_components');
  if (!hasStructComp) {
    await knex.schema.createTable('salary_structure_components', (table) => {
      table.increments('id').primary();
      table.integer('structure_id').notNullable();
      table.integer('component_id').notNullable();
      table.string('calc_type', 50).defaultTo('percentage'); // 'fixed', 'percentage', 'formula'
      table.decimal('value', 12, 2).defaultTo(0);
      table.string('percentage_basis', 50).defaultTo('basic'); // 'basic', 'gross'
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Enhance salary_components table
  const hasSalaryComponents = await knex.schema.hasTable('salary_components');
  if (hasSalaryComponents) {
    const hasCalcType = await knex.schema.hasColumn('salary_components', 'calc_type');
    if (!hasCalcType) {
      await knex.schema.alterTable('salary_components', (table) => {
        table.string('calc_type', 50).defaultTo('fixed');
        table.decimal('percentage_value', 6, 2).defaultTo(0);
        table.string('percentage_basis', 50).defaultTo('basic');
        table.decimal('default_amount', 12, 2).defaultTo(0);
        table.tinyint('is_statutory').defaultTo(0);
      });
    }
  }

  // 3. Enhance employee_salary_mappings table
  const hasSalaryMappings = await knex.schema.hasTable('employee_salary_mappings');
  if (hasSalaryMappings) {
    const hasAssignedDate = await knex.schema.hasColumn('employee_salary_mappings', 'assigned_date');
    if (!hasAssignedDate) {
      await knex.schema.alterTable('employee_salary_mappings', (table) => {
        table.date('assigned_date').nullable();
        table.date('effective_from').nullable();
        table.decimal('custom_gross', 12, 2).nullable();
      });
    }
  } else {
    await knex.schema.createTable('employee_salary_mappings', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('structure_id').notNullable();
      table.date('assigned_date').nullable();
      table.date('effective_from').nullable();
      table.decimal('custom_gross', 12, 2).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // 4. Enhance bonus_incentives table
  const hasBonus = await knex.schema.hasTable('bonus_incentives');
  if (hasBonus) {
    const hasReason = await knex.schema.hasColumn('bonus_incentives', 'reason');
    if (!hasReason) {
      await knex.schema.alterTable('bonus_incentives', (table) => {
        table.text('reason').nullable();
        table.string('applicable_month', 20).nullable();
        table.integer('applicable_year').nullable();
        table.integer('processed_in_payslip_id').nullable();
      });
    }
  }

  // 5. Enhance expense_claims table
  const hasClaims = await knex.schema.hasTable('expense_claims');
  if (hasClaims) {
    const hasProcessedId = await knex.schema.hasColumn('expense_claims', 'processed_in_payslip_id');
    if (!hasProcessedId) {
      await knex.schema.alterTable('expense_claims', (table) => {
        table.integer('processed_in_payslip_id').nullable();
      });
    }
  }

  // 6. Enhance loans_advances table
  const hasLoans = await knex.schema.hasTable('loans_advances');
  if (hasLoans) {
    const hasRemaining = await knex.schema.hasColumn('loans_advances', 'remaining_amount');
    if (!hasRemaining) {
      await knex.schema.alterTable('loans_advances', (table) => {
        table.decimal('remaining_amount', 12, 2).nullable();
        table.date('start_date').nullable();
      });
      // Set remaining_amount = amount for existing records if null
      await knex.raw('UPDATE loans_advances SET remaining_amount = amount WHERE remaining_amount IS NULL');
    }
  }

  // 7. Enhance tax_declarations table
  const hasTax = await knex.schema.hasTable('tax_declarations');
  if (hasTax) {
    const hasFY = await knex.schema.hasColumn('tax_declarations', 'financial_year');
    if (!hasFY) {
      await knex.schema.alterTable('tax_declarations', (table) => {
        table.string('financial_year', 20).defaultTo('2026-27');
      });
    }
  }

  // 8. Seed default components if none exist
  const count = await knex('salary_components').count('id as c');
  if (count[0].c === 0) {
    await knex('salary_components').insert([
      { name: 'Basic Salary', type: 'Earning', taxable: 'Yes', calc_type: 'percentage', percentage_value: 50, percentage_basis: 'gross', status: 'Active', is_statutory: 0 },
      { name: 'House Rent Allowance (HRA)', type: 'Earning', taxable: 'Partial', calc_type: 'percentage', percentage_value: 40, percentage_basis: 'basic', status: 'Active', is_statutory: 0 },
      { name: 'Special Allowance', type: 'Earning', taxable: 'Yes', calc_type: 'formula', default_amount: 0, status: 'Active', is_statutory: 0 },
      { name: 'Provident Fund (PF)', type: 'Deduction', taxable: 'No', calc_type: 'percentage', percentage_value: 12, percentage_basis: 'basic', status: 'Active', is_statutory: 1 },
      { name: 'Employee State Insurance (ESI)', type: 'Deduction', taxable: 'No', calc_type: 'percentage', percentage_value: 0.75, percentage_basis: 'gross', status: 'Active', is_statutory: 1 },
      { name: 'Professional Tax (PT)', type: 'Deduction', taxable: 'No', calc_type: 'fixed', default_amount: 200, status: 'Active', is_statutory: 1 }
    ]);
  }
};

exports.down = async function (knex) {
  // no-op for safety
};
