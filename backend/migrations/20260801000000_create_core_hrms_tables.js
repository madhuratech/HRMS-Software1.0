/**
 * Migration: Create Core HRMS Foundation Tables
 * 
 * This migration creates all foundational tables that subsequent migrations
 * depend on (employees, attendance, leave, payroll, salary, etc.).
 * 
 * All creates use hasTable() guards so they are safe to run on a partially
 * populated database.
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {

  // ── 1. branches ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('branches'))) {
    await knex.schema.createTable('branches', (table) => {
      table.increments('id').primary();
      table.string('branch_name', 100).notNullable().unique();
      table.string('location', 100).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 2. designations ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('designations'))) {
    await knex.schema.createTable('designations', (table) => {
      table.increments('id').primary();
      table.string('designation_name', 100).notNullable();
      table.string('designation_code', 50).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 3. company_profile ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('company_profile'))) {
    await knex.schema.createTable('company_profile', (table) => {
      table.integer('id').primary().defaultTo(1);
      table.string('company_name', 255).defaultTo('Madhura Tech');
      table.string('legal_company_name', 255).nullable();
      table.string('company_code', 50).nullable();
      table.string('company_type', 100).nullable();
      table.string('industry', 100).nullable();
      table.string('business_type', 100).nullable();
      table.string('year_established', 50).nullable();
      table.string('number_of_employees', 50).nullable();
      table.string('financial_year', 100).nullable();
      // contact
      table.string('official_email', 100).nullable();
      table.string('hr_email', 100).nullable();
      table.string('support_email', 100).nullable();
      table.string('website', 100).nullable();
      table.string('phone_number', 50).nullable();
      table.string('mobile_number', 50).nullable();
      table.string('alternate_number', 50).nullable();
      table.string('fax_number', 50).nullable();
      table.string('linkedin_url', 255).nullable();
      table.string('facebook_url', 255).nullable();
      table.string('twitter_url', 255).nullable();
      table.string('instagram_url', 255).nullable();
      // address
      table.string('head_office_address1', 255).nullable();
      table.string('head_office_address2', 255).nullable();
      table.string('head_office_landmark', 255).nullable();
      table.string('head_office_city', 100).nullable();
      table.string('head_office_state', 100).nullable();
      table.string('head_office_country', 100).nullable();
      table.string('head_office_zip_code', 50).nullable();
      table.string('head_office_google_maps_url', 255).nullable();
      table.string('branch_name', 255).nullable();
      table.string('branch_address', 255).nullable();
      table.string('branch_city', 100).nullable();
      table.string('branch_state', 100).nullable();
      table.string('branch_country', 100).nullable();
      table.string('branch_zip_code', 50).nullable();
      // business
      table.string('gst_number', 50).nullable();
      table.string('pan_number', 50).nullable();
      table.string('cin_number', 50).nullable();
      table.string('tan_number', 50).nullable();
      table.string('msme_number', 50).nullable();
      table.string('iec_code', 50).nullable();
      table.string('pf_registration_number', 100).nullable();
      table.string('esi_registration_number', 100).nullable();
      table.string('professional_tax_number', 100).nullable();
      table.string('labour_license_number', 100).nullable();
      table.string('shop_establishment_number', 100).nullable();
      // hr_settings
      table.string('employee_id_prefix', 50).nullable();
      table.string('auto_generate_employee_id', 50).nullable();
      table.string('default_department', 100).nullable();
      table.string('default_designation', 100).nullable();
      table.string('probation_period', 50).nullable();
      table.string('notice_period', 50).nullable();
      table.string('default_shift', 100).nullable();
      table.string('working_days', 100).nullable();
      table.string('weekend_policy', 100).nullable();
      table.string('attendance_method', 100).nullable();
      table.boolean('biometric_enabled').defaultTo(true);
      table.boolean('overtime_enabled').defaultTo(false);
      table.boolean('leave_carry_forward').defaultTo(true);
      // payroll
      table.string('payroll_frequency', 50).nullable();
      table.string('salary_cycle', 100).nullable();
      table.string('salary_payment_date', 50).nullable();
      table.string('basic_salary_pct', 50).nullable();
      table.string('hra_pct', 50).nullable();
      table.boolean('pf_enabled').defaultTo(true);
      table.boolean('esi_enabled').defaultTo(true);
      table.boolean('professional_tax').defaultTo(true);
      table.boolean('tds_enabled').defaultTo(true);
      table.boolean('bonus_enabled').defaultTo(false);
      table.boolean('gratuity_enabled').defaultTo(true);
      table.string('payroll_approval', 100).nullable();
      // banking
      table.string('bank_name', 100).nullable();
      table.string('bank_branch_name', 100).nullable();
      table.string('account_holder_name', 255).nullable();
      table.string('account_number', 100).nullable();
      table.string('confirm_account_number', 100).nullable();
      table.string('ifsc_code', 50).nullable();
      table.string('swift_code', 50).nullable();
      table.string('micr_code', 50).nullable();
      table.string('upi_id', 100).nullable();
      table.string('salary_payment_method', 100).nullable();
      // branding
      table.string('company_theme_color', 50).nullable();
      table.string('secondary_theme_color', 50).nullable();
      table.string('company_logo_name', 255).nullable();
      table.string('favicon_name', 255).nullable();
      table.string('login_bg_name', 255).nullable();
      table.string('dashboard_banner_name', 255).nullable();
      table.string('email_header_logo_name', 255).nullable();
      table.string('email_footer_logo_name', 255).nullable();
      table.string('company_seal_name', 255).nullable();
      table.string('digital_signature_name', 255).nullable();
      // documents & system
      table.text('documents').nullable();
      table.string('language', 100).nullable();
      table.string('time_zone', 100).nullable();
      table.string('currency', 50).nullable();
      table.string('date_format', 50).nullable();
      table.string('time_format', 50).nullable();
      table.string('password_policy', 255).nullable();
      table.boolean('two_factor_authentication').defaultTo(true);
      table.string('session_timeout', 50).nullable();
      table.string('login_attempts', 50).nullable();
      table.boolean('email_notification').defaultTo(true);
      table.boolean('sms_notification').defaultTo(false);
      table.boolean('push_notification').defaultTo(true);
      table.string('smtp', 100).nullable();
      table.string('sms_gateway', 100).nullable();
      table.string('google_workspace', 100).nullable();
      table.string('microsoft_365', 100).nullable();
      table.string('biometric_device', 100).nullable();
    });
    // Seed default company profile
    await knex('company_profile').insert({ id: 1 }).onConflict('id').ignore();
  }

  // ── 4. employees ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employees'))) {
    await knex.schema.createTable('employees', (table) => {
      table.increments('id').primary();
      table.string('employee_id', 50).nullable();
      table.string('employee_code', 50).nullable();
      table.string('name', 255).notNullable();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('phone', 20).nullable();
      table.string('mobile', 20).nullable();
      table.string('alternate_phone', 20).nullable();
      table.date('dob').nullable();
      table.string('gender', 20).nullable();
      table.string('blood_group', 10).nullable();
      table.string('marital_status', 30).nullable();
      table.string('nationality', 100).nullable();
      table.text('permanent_address').nullable();
      table.text('current_address').nullable();
      table.string('city', 100).nullable();
      table.string('state', 100).nullable();
      table.string('country', 100).nullable();
      table.string('zip_code', 20).nullable();
      table.date('join_date').nullable();
      table.date('confirmation_date').nullable();
      table.date('resignation_date').nullable();
      table.date('last_working_date').nullable();
      table.string('employment_type', 50).defaultTo('Full Time');
      table.string('status', 50).defaultTo('Active');
      table.string('role', 50).defaultTo('Employee');
      table.integer('role_id').nullable();
      table.integer('department_id').nullable();
      table.integer('designation_id').nullable();
      table.integer('branch_id').nullable();
      table.integer('reporting_manager_id').nullable();
      table.decimal('basic_salary', 15, 2).nullable();
      table.decimal('gross_salary', 15, 2).nullable();
      table.decimal('net_salary', 15, 2).nullable();
      table.decimal('sales_target', 12, 2).defaultTo(0.00);
      table.string('bank_name', 100).nullable();
      table.string('bank_account_number', 50).nullable();
      table.string('bank_ifsc_code', 20).nullable();
      table.string('pan_number', 20).nullable();
      table.string('aadhaar_number', 20).nullable();
      table.string('pf_number', 50).nullable();
      table.string('esi_number', 50).nullable();
      table.string('uan_number', 50).nullable();
      table.string('photo', 500).nullable();
      table.string('resume', 500).nullable();
      table.string('experience', 100).nullable();
      table.string('shift_type', 100).nullable().defaultTo('Regular Shift');
      table.string('work_location', 100).nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
      table.timestamp('deleted_at').nullable();
    });
  }

  // ── 5. attendance ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('attendance'))) {
    await knex.schema.createTable('attendance', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.date('date').nullable();
      table.string('punch_type', 10).nullable(); // IN / OUT
      table.timestamp('punch_time').nullable();
      table.time('punch_in').nullable();
      table.time('punch_out').nullable();
      table.string('status', 50).defaultTo('Present');
      table.decimal('work_hours', 5, 2).nullable();
      table.decimal('latitude', 10, 8).nullable();
      table.decimal('longitude', 11, 8).nullable();
      table.string('location_address', 500).nullable();
      table.string('ip_address', 50).nullable();
      table.string('device_info', 255).nullable();
      table.string('photo', 500).nullable();
      table.text('remarks').nullable();
      table.integer('created_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 6. LocationHistory ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('LocationHistory'))) {
    await knex.schema.createTable('LocationHistory', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').unsigned().notNullable();
      table.decimal('latitude', 10, 8).nullable();
      table.decimal('longitude', 11, 8).nullable();
      table.timestamp('timestamp').defaultTo(knex.fn.now());
      table.integer('visit_id').unsigned().nullable();
    });
  }

  // ── 7. leave_types ───────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('leave_types'))) {
    await knex.schema.createTable('leave_types', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('code', 20).nullable();
      table.integer('days_allowed').nullable();
      table.integer('max_days').nullable();
      table.boolean('is_paid').defaultTo(true);
      table.string('forward', 10).defaultTo('No');
      table.string('applicable_to', 100).nullable();
      table.string('description', 500).nullable();
      table.string('status', 30).defaultTo('Active');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
    // Seed default leave types
    await knex('leave_types').insert([
      { id: 1, name: 'Sick Leave', code: 'SL', days_allowed: 12, max_days: 12, is_paid: true },
      { id: 2, name: 'Casual Leave', code: 'CL', days_allowed: 12, max_days: 12, is_paid: true },
      { id: 3, name: 'Earned Leave', code: 'EL', days_allowed: 15, max_days: 15, is_paid: true },
      { id: 4, name: 'Privilege Leave', code: 'PL', days_allowed: 15, max_days: 15, forward: 'Yes', is_paid: true },
      { id: 5, name: 'Paternity Leave', code: 'PTL', days_allowed: 15, max_days: 15, is_paid: true },
      { id: 6, name: 'Maternity Leave', code: 'ML', days_allowed: 182, max_days: 182, is_paid: true },
      { id: 7, name: 'Compensatory Off', code: 'COMP', days_allowed: 10, max_days: 10, is_paid: true },
    ]);
  }

  // ── 8. leave_balances ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('leave_balances'))) {
    await knex.schema.createTable('leave_balances', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('leave_type_id').notNullable();
      table.decimal('used_days', 5, 2).defaultTo(0);
      table.decimal('remaining_days', 5, 2).notNullable().defaultTo(0);
      table.integer('days_used').defaultTo(0);
      table.integer('days_remaining').defaultTo(0);
      table.integer('year').notNullable().defaultTo(new Date().getFullYear());
      table.unique(['employee_id', 'leave_type_id', 'year']);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 9. leave_applications ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('leave_applications'))) {
    await knex.schema.createTable('leave_applications', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('leave_type_id').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.decimal('total_days', 5, 2).nullable();
      table.text('reason').nullable();
      table.string('status', 20).defaultTo('Pending');
      table.integer('approved_by').nullable();
      table.text('approval_remarks').nullable();
      table.date('applied_on').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 10. salary_structures ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('salary_structures'))) {
    await knex.schema.createTable('salary_structures', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('code', 50).notNullable().unique();
      table.string('frequency', 50).defaultTo('Monthly');
      table.decimal('total_ctc', 12, 2).defaultTo(0);
      table.string('status', 30).defaultTo('Active');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 11. salary_components ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('salary_components'))) {
    await knex.schema.createTable('salary_components', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('type', 50).notNullable(); // Earning / Deduction / Contribution
      table.string('taxable', 10).defaultTo('Yes');
      table.string('formula', 255).nullable();
      table.string('frequency', 50).defaultTo('Monthly');
      table.string('status', 30).defaultTo('Active');
      table.string('calc_type', 50).defaultTo('fixed');
      table.decimal('percentage_value', 6, 2).defaultTo(0);
      table.string('percentage_basis', 50).defaultTo('basic');
      table.decimal('default_amount', 12, 2).defaultTo(0);
      table.tinyint('is_statutory').defaultTo(0);
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 12. employee_salary_mappings ──────────────────────────────────────────
  if (!(await knex.schema.hasTable('employee_salary_mappings'))) {
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

  // ── 13. payroll_runs ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('payroll_runs'))) {
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

  // ── 14. payslips ──────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('payslips'))) {
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

  // ── 15. bonus_incentives ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('bonus_incentives'))) {
    await knex.schema.createTable('bonus_incentives', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('bonus_type', 100).nullable();
      table.decimal('amount', 12, 2).notNullable();
      table.date('effective_date').nullable();
      table.text('reason').nullable();
      table.string('applicable_month', 20).nullable();
      table.integer('applicable_year').nullable();
      table.integer('processed_in_payslip_id').nullable();
      table.string('status', 50).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 16. loans_advances ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('loans_advances'))) {
    await knex.schema.createTable('loans_advances', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('loan_type', 100).nullable();
      table.decimal('amount', 12, 2).notNullable();
      table.decimal('remaining_amount', 12, 2).nullable();
      table.date('start_date').nullable();
      table.date('disbursement_date').nullable();
      table.integer('installments').nullable();
      table.decimal('emi_amount', 12, 2).nullable();
      table.text('reason').nullable();
      table.string('status', 50).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 17. tax_declarations ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('tax_declarations'))) {
    await knex.schema.createTable('tax_declarations', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('financial_year', 20).defaultTo('2026-27');
      table.string('declaration_type', 100).nullable();
      table.decimal('declared_amount', 12, 2).nullable();
      table.string('proof_document', 500).nullable();
      table.string('status', 50).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 18. activity_logs ─────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('activity_logs'))) {
    await knex.schema.createTable('activity_logs', (table) => {
      table.increments('id').primary();
      table.string('user_email', 100).notNullable();
      table.string('action', 255).notNullable();
      table.text('details').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 19. tickets ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('ticket_categories'))) {
    await knex.schema.createTable('ticket_categories', (table) => {
      table.increments('id').primary();
      table.string('name', 50).notNullable().unique();
    });
  }

  if (!(await knex.schema.hasTable('ticket_priorities'))) {
    await knex.schema.createTable('ticket_priorities', (table) => {
      table.increments('id').primary();
      table.string('name', 50).notNullable().unique();
    });
  }

  if (!(await knex.schema.hasTable('tickets'))) {
    await knex.schema.createTable('tickets', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('category_id').nullable();
      table.integer('priority_id').nullable();
      table.string('subject', 150).notNullable();
      table.text('description').nullable();
      table.string('status', 30).defaultTo('Open');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 20. training_programs ─────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('training_programs'))) {
    await knex.schema.createTable('training_programs', (table) => {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.string('trainer', 100).nullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.string('status', 50).defaultTo('planned');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 21. employment_history ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('employment_history'))) {
    await knex.schema.createTable('employment_history', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('company_name', 255).notNullable();
      table.string('job_title', 255).notNullable();
      table.date('start_date').nullable();
      table.date('end_date').nullable();
      table.text('responsibilities').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 22. transfers ─────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('transfers'))) {
    await knex.schema.createTable('transfers', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.string('previous_department', 255).notNullable();
      table.string('new_department', 255).notNullable();
      table.date('transfer_date').notNullable();
      table.text('reason').nullable();
      table.string('status', 50).defaultTo('Pending');
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 23. exit_management ───────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('exit_management'))) {
    await knex.schema.createTable('exit_management', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.date('resignation_date').notNullable();
      table.date('last_working_day').nullable();
      table.text('reason').nullable();
      table.string('status', 50).defaultTo('Pending');
      table.text('exit_interview_notes').nullable();
      table.integer('created_by').nullable();
      table.integer('updated_by').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
    });
  }

  // ── 24. shift_roster ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('shift_roster'))) {
    await knex.schema.createTable('shift_roster', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.integer('shift_id').notNullable();
      table.date('start_date').notNullable();
      table.date('end_date').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 25. regularization_requests ───────────────────────────────────────────
  if (!(await knex.schema.hasTable('regularization_requests'))) {
    await knex.schema.createTable('regularization_requests', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.date('date').notNullable();
      table.time('requested_punch_in').nullable();
      table.time('requested_punch_out').nullable();
      table.text('reason').nullable();
      table.string('status', 20).defaultTo('Pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 26. daily_attendance ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('daily_attendance'))) {
    await knex.schema.createTable('daily_attendance', (table) => {
      table.increments('id').primary();
      table.integer('employee_id').notNullable();
      table.date('date').notNullable();
      table.time('punch_in').nullable();
      table.time('punch_out').nullable();
      table.string('status', 50).defaultTo('Present');
      table.decimal('work_hours', 5, 2).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['employee_id', 'date']);
    });
  }

  // ── 27. sales_enquiries / sales_entries / sales_followups ─────────────────
  if (!(await knex.schema.hasTable('sales_enquiries'))) {
    await knex.schema.createTable('sales_enquiries', (table) => {
      table.increments('id').primary();
      table.string('customer_name', 255).notNullable();
      table.string('contact_email', 255).nullable();
      table.string('contact_phone', 50).nullable();
      table.text('enquiry_details').nullable();
      table.string('status', 50).defaultTo('new');
      table.integer('assigned_to').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('sales_entries'))) {
    await knex.schema.createTable('sales_entries', (table) => {
      table.increments('id').primary();
      table.integer('enquiry_id').nullable();
      table.decimal('amount', 10, 2).notNullable();
      table.date('sale_date').nullable();
      table.text('notes').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('sales_followups'))) {
    await knex.schema.createTable('sales_followups', (table) => {
      table.increments('id').primary();
      table.integer('enquiry_id').nullable();
      table.date('followup_date').nullable();
      table.text('notes').nullable();
      table.string('next_action', 255).nullable();
      table.string('status', 30).defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // ── 28. task_board ────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('task_board'))) {
    await knex.schema.createTable('task_board', (table) => {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.string('status', 50).defaultTo('todo');
      table.string('priority', 50).defaultTo('medium');
      table.integer('assignee_id').nullable();
      table.date('due_date').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop in reverse dependency order
  await knex.schema.dropTableIfExists('task_board');
  await knex.schema.dropTableIfExists('sales_followups');
  await knex.schema.dropTableIfExists('sales_entries');
  await knex.schema.dropTableIfExists('sales_enquiries');
  await knex.schema.dropTableIfExists('daily_attendance');
  await knex.schema.dropTableIfExists('regularization_requests');
  await knex.schema.dropTableIfExists('shift_roster');
  await knex.schema.dropTableIfExists('exit_management');
  await knex.schema.dropTableIfExists('transfers');
  await knex.schema.dropTableIfExists('employment_history');
  await knex.schema.dropTableIfExists('training_programs');
  await knex.schema.dropTableIfExists('tickets');
  await knex.schema.dropTableIfExists('ticket_priorities');
  await knex.schema.dropTableIfExists('ticket_categories');
  await knex.schema.dropTableIfExists('activity_logs');
  await knex.schema.dropTableIfExists('tax_declarations');
  await knex.schema.dropTableIfExists('loans_advances');
  await knex.schema.dropTableIfExists('bonus_incentives');
  await knex.schema.dropTableIfExists('payslips');
  await knex.schema.dropTableIfExists('payroll_runs');
  await knex.schema.dropTableIfExists('employee_salary_mappings');
  await knex.schema.dropTableIfExists('salary_components');
  await knex.schema.dropTableIfExists('salary_structures');
  await knex.schema.dropTableIfExists('leave_applications');
  await knex.schema.dropTableIfExists('leave_balances');
  await knex.schema.dropTableIfExists('leave_types');
  await knex.schema.dropTableIfExists('LocationHistory');
  await knex.schema.dropTableIfExists('attendance');
  await knex.schema.dropTableIfExists('employees');
  await knex.schema.dropTableIfExists('company_profile');
  await knex.schema.dropTableIfExists('designations');
  await knex.schema.dropTableIfExists('branches');
};
