/**
 * Migration: Enhance Payroll Module (payslips & payroll_runs)
 */
exports.up = async function (knex) {
  // 1. Check and enhance 'payslips' table
  const hasPayslips = await knex.schema.hasTable('payslips');
  if (hasPayslips) {
    await knex.schema.alterTable('payslips', (table) => {
      table.string('month', 20).nullable();
      table.integer('year').nullable();
      table.decimal('hra', 12, 2).defaultTo(0);
      table.decimal('bonus', 12, 2).defaultTo(0);
      table.decimal('other_earnings', 12, 2).defaultTo(0);
      table.decimal('gross_salary', 12, 2).defaultTo(0);
      table.decimal('pf', 12, 2).defaultTo(0);
      table.decimal('esi', 12, 2).defaultTo(0);
      table.decimal('tax', 12, 2).defaultTo(0);
      table.decimal('lop_days', 5, 2).defaultTo(0);
      table.decimal('lop_amount', 12, 2).defaultTo(0);
      table.decimal('other_deductions', 12, 2).defaultTo(0);
      table.string('payment_mode', 50).defaultTo('Bank Transfer');
      table.timestamp('payment_date').nullable();
      table.text('earnings_breakdown').nullable();
      table.text('deductions_breakdown').nullable();
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Alter status column to allow all valid workflow statuses: Draft, Generated, Approved, Paid
    await knex.raw("ALTER TABLE payslips MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Generated'");

    // Add unique constraint on employee_id, month, year if not already present
    try {
      await knex.raw("ALTER TABLE payslips ADD UNIQUE KEY unique_emp_month_year (employee_id, month, year)");
    } catch (e) {
      console.log("Index unique_emp_month_year may already exist or cannot be added:", e.message);
    }
  } else {
    await knex.schema.createTable('payslips', (table) => {
      table.increments('id').primary();
      table.integer('payroll_run_id').nullable();
      table.integer('employee_id').notNullable();
      table.string('month', 20).notNullable();
      table.integer('year').notNullable();
      table.decimal('basic', 12, 2).defaultTo(0);
      table.decimal('hra', 12, 2).defaultTo(0);
      table.decimal('allowances', 12, 2).defaultTo(0);
      table.decimal('bonus', 12, 2).defaultTo(0);
      table.decimal('other_earnings', 12, 2).defaultTo(0);
      table.decimal('gross_salary', 12, 2).defaultTo(0);
      table.decimal('pf', 12, 2).defaultTo(0);
      table.decimal('esi', 12, 2).defaultTo(0);
      table.decimal('tax', 12, 2).defaultTo(0);
      table.decimal('lop_days', 5, 2).defaultTo(0);
      table.decimal('lop_amount', 12, 2).defaultTo(0);
      table.decimal('other_deductions', 12, 2).defaultTo(0);
      table.decimal('total_deductions', 12, 2).defaultTo(0);
      table.decimal('net_salary', 12, 2).defaultTo(0);
      table.string('payment_mode', 50).defaultTo('Bank Transfer');
      table.timestamp('payment_date').nullable();
      table.string('status', 50).defaultTo('Generated');
      table.text('earnings_breakdown').nullable();
      table.text('deductions_breakdown').nullable();
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.unique(['employee_id', 'month', 'year']);
    });
  }

  // 2. Check and enhance 'payroll_runs' table
  const hasPayrollRuns = await knex.schema.hasTable('payroll_runs');
  if (hasPayrollRuns) {
    await knex.schema.alterTable('payroll_runs', (table) => {
      table.integer('total_employees').defaultTo(0);
      table.integer('processed_employees').defaultTo(0);
      table.decimal('gross_amount', 15, 2).defaultTo(0);
      table.decimal('net_amount', 15, 2).defaultTo(0);
      table.decimal('total_deductions', 15, 2).defaultTo(0);
      table.timestamp('payment_date').nullable();
      table.integer('created_by').nullable();
    });

    await knex.raw("ALTER TABLE payroll_runs MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Generated'");
  } else {
    await knex.schema.createTable('payroll_runs', (table) => {
      table.increments('id').primary();
      table.string('period_month', 20).notNullable();
      table.string('period_year', 10).notNullable();
      table.integer('total_employees').defaultTo(0);
      table.integer('processed_employees').defaultTo(0);
      table.decimal('gross_amount', 15, 2).defaultTo(0);
      table.decimal('net_amount', 15, 2).defaultTo(0);
      table.decimal('total_deductions', 15, 2).defaultTo(0);
      table.string('status', 50).defaultTo('Generated');
      table.timestamp('payment_date').nullable();
      table.integer('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  // rollback
};
