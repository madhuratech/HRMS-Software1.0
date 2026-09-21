const db = require('../config/database');

class PayrollService {
  /**
   * Execute raw SQL helper returning a Promise
   */
  static query(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  }

  /**
   * Get active company payroll rules from company_profile
   */
  static async getCompanySettings() {
    try {
      const rows = await this.query("SELECT * FROM company_profile LIMIT 1");
      const c = rows[0] || {};
      return {
        company_name: c.company_name || 'Madhura Technologies',
        head_office_address: c.head_office_address || 'Tamil Nadu, India',
        official_email: c.official_email || 'hr@madhuratech.com',
        phone_number: c.phone_number || '+91 9876543210',
        basic_salary_pct: parseFloat(c.basic_salary_pct) || 50.0,
        hra_pct: parseFloat(c.hra_pct) || 40.0,
        pf_enabled: c.pf_enabled !== undefined ? Boolean(c.pf_enabled) : true,
        esi_enabled: c.esi_enabled !== undefined ? Boolean(c.esi_enabled) : true,
        professional_tax: c.professional_tax !== undefined ? Boolean(c.professional_tax) : true,
        tds_enabled: Boolean(c.tds_enabled)
      };
    } catch (e) {
      return {
        company_name: 'Madhura Technologies',
        basic_salary_pct: 50.0,
        hra_pct: 40.0,
        pf_enabled: true,
        esi_enabled: true,
        professional_tax: true,
        tds_enabled: false
      };
    }
  }

  /**
   * Resolve days in given month and year
   */
  static getDaysInMonth(monthName, year) {
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIndex = months.indexOf(String(monthName).toLowerCase());
    if (monthIndex === -1) return 30;
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  /**
   * Calculate LOP (Loss of Pay) from approved unpaid leaves and marked absences
   */
  static async calculateLop(employeeId, monthName, year, monthlySalary) {
    try {
      const months = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthNum = months.indexOf(String(monthName).toLowerCase()) + 1;
      if (monthNum < 1) return { lop_days: 0, lop_amount: 0 };

      const daysInMonth = this.getDaysInMonth(monthName, year);
      const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      // 1. Unpaid approved leaves
      const unpaidLeaves = await this.query(`
        SELECT COALESCE(SUM(DATEDIFF(LEAST(end_date, ?), GREATEST(start_date, ?)) + 1), 0) as days
        FROM leave_applications la
        LEFT JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.employee_id = ?
          AND la.status = 'Approved'
          AND (lt.is_paid = 0 OR lt.is_paid IS NULL OR LOWER(lt.name) LIKE '%unpaid%' OR LOWER(lt.name) LIKE '%lop%')
          AND la.start_date <= ? AND la.end_date >= ?
      `, [endDate, startDate, employeeId, endDate, startDate]);

      const unpaidLeaveDays = parseFloat(unpaidLeaves[0]?.days || 0);

      // 2. Marked absences in daily_attendance
      const absentRecords = await this.query(`
        SELECT COUNT(*) as days
        FROM daily_attendance
        WHERE employee_id = ?
          AND date >= ? AND date <= ?
          AND status = 'Absent'
      `, [employeeId, startDate, endDate]);

      const absentDays = parseFloat(absentRecords[0]?.days || 0);
      const totalLopDays = unpaidLeaveDays + absentDays;

      const perDaySalary = daysInMonth > 0 ? (monthlySalary / daysInMonth) : 0;
      const lopAmount = Math.round(perDaySalary * totalLopDays * 100) / 100;

      return {
        lop_days: totalLopDays,
        lop_amount: lopAmount,
        days_in_month: daysInMonth,
        payable_days: Math.max(0, daysInMonth - totalLopDays)
      };
    } catch (err) {
      console.error("Error calculating LOP:", err);
      return { lop_days: 0, lop_amount: 0, days_in_month: 30, payable_days: 30 };
    }
  }

  /**
   * Fetch approved unprocessed bonus and incentive records for an employee
   */
  static async getApprovedBonuses(employeeId, monthName, year) {
    try {
      const bonuses = await this.query(`
        SELECT id, bonus_type, amount, reason
        FROM bonus_incentives
        WHERE employee_id = ?
          AND status = 'Approved'
          AND (processed_in_payslip_id IS NULL OR processed_in_payslip_id = 0)
          AND (applicable_month IS NULL OR LOWER(applicable_month) = LOWER(?) OR applicable_month = '')
          AND (applicable_year IS NULL OR applicable_year = ? OR applicable_year = 0)
      `, [employeeId, monthName, year]);

      const totalBonus = bonuses.reduce((acc, b) => acc + parseFloat(b.amount || 0), 0);
      return {
        total_bonus: totalBonus,
        items: bonuses
      };
    } catch (e) {
      return { total_bonus: 0, items: [] };
    }
  }

  /**
   * Fetch approved unprocessed reimbursement claims for an employee
   */
  static async getApprovedReimbursements(employeeId, monthName, year) {
    try {
      const months = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthNum = months.indexOf(String(monthName).toLowerCase()) + 1;
      const daysInMonth = this.getDaysInMonth(monthName, year);
      const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const claims = await this.query(`
        SELECT id, title, amount, category_id
        FROM expense_claims
        WHERE employee_id = ?
          AND status = 'Approved'
          AND (processed_in_payslip_id IS NULL OR processed_in_payslip_id = 0)
          AND date >= ? AND date <= ?
      `, [employeeId, startDate, endDate]);

      const totalClaims = claims.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
      return {
        total_reimbursements: totalClaims,
        items: claims
      };
    } catch (e) {
      return { total_reimbursements: 0, items: [] };
    }
  }

  /**
   * Fetch active loans and monthly EMI deductions for an employee
   */
  static async getActiveLoanDeductions(employeeId) {
    try {
      const loans = await this.query(`
        SELECT id, type, amount, emi, remaining_amount
        FROM loans_advances
        WHERE employee_id = ?
          AND status = 'Active'
          AND (remaining_amount > 0 OR remaining_amount IS NULL)
      `, [employeeId]);

      let totalEmi = 0;
      const items = loans.map(l => {
        const remaining = l.remaining_amount !== null && l.remaining_amount !== undefined ? parseFloat(l.remaining_amount) : parseFloat(l.amount);
        const emi = parseFloat(l.emi || 0);
        const deduction = Math.min(emi, remaining);
        totalEmi += deduction;
        return {
          id: l.id,
          type: l.type,
          deduction: deduction,
          remaining_before: remaining,
          remaining_after: Math.max(0, remaining - deduction)
        };
      });

      return {
        total_loan_emi: totalEmi,
        items: items
      };
    } catch (e) {
      return { total_loan_emi: 0, items: [] };
    }
  }

  /**
   * Resolve assigned salary structure and components for an employee
   */
  static async getEmployeeSalaryStructure(employeeId) {
    // 1. Check direct mapping
    const mappings = await this.query(`
      SELECT 
        esm.*,
        ss.name as structure_name,
        ss.code as structure_code,
        ss.total_ctc as structure_ctc,
        ss.frequency
      FROM employee_salary_mappings esm
      JOIN salary_structures ss ON esm.structure_id = ss.id
      WHERE esm.employee_id = ?
      LIMIT 1
    `, [employeeId]);

    if (mappings.length > 0) {
      const map = mappings[0];
      // Fetch components for this structure
      const components = await this.query(`
        SELECT 
          ssc.*,
          sc.name as component_name,
          sc.type as component_type,
          sc.taxable,
          sc.is_statutory
        FROM salary_structure_components ssc
        JOIN salary_components sc ON ssc.component_id = sc.id
        WHERE ssc.structure_id = ?
      `, [map.structure_id]);

      return {
        has_structure: true,
        structure_id: map.structure_id,
        structure_name: map.structure_name,
        total_ctc: parseFloat(map.custom_gross || map.structure_ctc || 0),
        components: components
      };
    }

    return { has_structure: false, components: [] };
  }

  /**
   * Calculate single employee payroll deterministically
   */
  static async calculateEmployeePayroll(employeeId, monthName, year) {
    // 1. Employee verification
    const empRows = await this.query(`
      SELECT e.*, d.dept_name as department_name, des.role_name as designation_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE e.id = ?
      LIMIT 1
    `, [employeeId]);

    if (empRows.length === 0) {
      throw new Error(`Employee with ID ${employeeId} not found.`);
    }

    const emp = empRows[0];
    const structureInfo = await this.getEmployeeSalaryStructure(employeeId);
    const company = await this.getCompanySettings();

    // 2. Base salary resolution
    let baseSalary = 0;
    if (emp.salary && parseFloat(emp.salary) > 0) {
      baseSalary = parseFloat(emp.salary);
    } else if (structureInfo.has_structure && structureInfo.total_ctc > 0) {
      baseSalary = structureInfo.total_ctc;
    }

    if (baseSalary <= 0) {
      const err = new Error(`Salary structure is not configured for this employee.`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Components Calculation
    let basic = 0;
    let hra = 0;
    let allowances = 0;
    let otherEarnings = 0;
    let pf = 0;
    let esi = 0;
    let tax = 0;
    let otherDeductions = 0;

    const earningsBreakdownList = [];
    const deductionsBreakdownList = [];

    if (structureInfo.components && structureInfo.components.length > 0) {
      // Dynamic structure components execution
      let basicComponent = structureInfo.components.find(c => c.component_type === 'Earning' && String(c.component_name || '').toLowerCase().includes('basic'));
      if (basicComponent) {
        if (basicComponent.calc_type === 'percentage') {
          basic = (baseSalary * parseFloat(basicComponent.value)) / 100;
        } else {
          basic = parseFloat(basicComponent.value);
        }
      } else {
        basic = (baseSalary * company.basic_salary_pct) / 100;
      }
      earningsBreakdownList.push({ name: 'Basic Salary', type: 'Earning', amount: basic });

      for (const comp of structureInfo.components) {
        const cName = String(comp.component_name || '').toLowerCase();
        if (comp.component_type === 'Earning') {
          if (cName.includes('basic')) continue;
          let amt = 0;
          if (comp.calc_type === 'percentage') {
            const base = comp.percentage_basis === 'gross' ? baseSalary : basic;
            amt = (base * parseFloat(comp.value)) / 100;
          } else if (comp.calc_type === 'fixed') {
            amt = parseFloat(comp.value);
          } else {
            // Formula / Balance
            amt = Math.max(0, baseSalary - basic - hra);
          }

          if (cName.includes('hra')) {
            hra = amt;
          } else {
            allowances += amt;
          }
          earningsBreakdownList.push({ name: comp.component_name, type: 'Earning', amount: amt });
        } else if (comp.component_type === 'Deduction') {
          let amt = 0;
          if (comp.calc_type === 'percentage') {
            const base = comp.percentage_basis === 'gross' ? baseSalary : basic;
            amt = (base * parseFloat(comp.value)) / 100;
          } else {
            amt = parseFloat(comp.value);
          }

          if (cName.includes('pf')) pf = amt;
          else if (cName.includes('esi')) esi = amt;
          else if (cName.includes('tax') || cName.includes('pt')) tax += amt;
          else otherDeductions += amt;

          deductionsBreakdownList.push({ name: comp.component_name, type: 'Deduction', amount: amt });
        }
      }
    } else {
      // Standard statutory and configured company base
      basic = Math.round((baseSalary * company.basic_salary_pct) / 100);
      hra = Math.round((basic * company.hra_pct) / 100);
      allowances = Math.max(0, baseSalary - basic - hra);

      earningsBreakdownList.push({ name: 'Basic Salary', type: 'Earning', amount: basic });
      earningsBreakdownList.push({ name: 'House Rent Allowance (HRA)', type: 'Earning', amount: hra });
      if (allowances > 0) {
        earningsBreakdownList.push({ name: 'Special Allowance', type: 'Earning', amount: allowances });
      }

      if (company.pf_enabled) {
        pf = Math.round(basic * 0.12);
        deductionsBreakdownList.push({ name: 'Provident Fund (PF - 12%)', type: 'Deduction', amount: pf });
      }

      if (company.esi_enabled && baseSalary <= 21000) {
        esi = Math.round(baseSalary * 0.0075);
        deductionsBreakdownList.push({ name: 'ESI (0.75%)', type: 'Deduction', amount: esi });
      }

      if (company.professional_tax && baseSalary >= 15000) {
        tax = 200;
        deductionsBreakdownList.push({ name: 'Professional Tax (PT)', type: 'Deduction', amount: 200 });
      }
    }

    // 4. Loss of Pay (LOP) from leaves & attendance
    const lopInfo = await this.calculateLop(employeeId, monthName, year, baseSalary);
    if (lopInfo.lop_amount > 0) {
      deductionsBreakdownList.push({
        name: `Loss of Pay (LOP - ${lopInfo.lop_days} days)`,
        type: 'Deduction',
        amount: lopInfo.lop_amount
      });
    }

    // 5. Approved Bonuses & Incentives
    const bonusInfo = await this.getApprovedBonuses(employeeId, monthName, year);
    const bonus = bonusInfo.total_bonus;
    if (bonus > 0) {
      bonusInfo.items.forEach(b => {
        earningsBreakdownList.push({
          name: `Bonus: ${b.bonus_type || 'Performance Reward'}`,
          type: 'Bonus',
          id: b.id,
          amount: parseFloat(b.amount)
        });
      });
    }

    // 6. Approved Reimbursements
    const reimbInfo = await this.getApprovedReimbursements(employeeId, monthName, year);
    const reimbursements = reimbInfo.total_reimbursements;
    if (reimbursements > 0) {
      reimbInfo.items.forEach(c => {
        earningsBreakdownList.push({
          name: `Reimbursement: ${c.title || 'Expense Claim'}`,
          type: 'Reimbursement',
          id: c.id,
          amount: parseFloat(c.amount)
        });
      });
    }

    // 7. Active Loan Deductions
    const loanInfo = await this.getActiveLoanDeductions(employeeId);
    const loanDeduction = loanInfo.total_loan_emi;
    if (loanDeduction > 0) {
      loanInfo.items.forEach(l => {
        deductionsBreakdownList.push({
          name: `Loan Recovery: ${l.type || 'EMI'}`,
          type: 'Loan',
          id: l.id,
          amount: l.deduction
        });
      });
    }

    // 8. Totals Calculation
    const grossSalary = Math.round((basic + hra + allowances + bonus + reimbursements + otherEarnings) * 100) / 100;
    const totalDeductions = Math.round((pf + esi + tax + lopInfo.lop_amount + loanDeduction + otherDeductions) * 100) / 100;
    const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

    return {
      employee_id: emp.id,
      employee_name: emp.name,
      employee_email: emp.email,
      emp_code: emp.employee_id || `EMP${String(emp.id).padStart(4, '0')}`,
      department_id: emp.department_id,
      department: emp.department_name || 'General',
      designation: emp.designation_name || 'Staff',
      join_date: emp.join_date,
      payment_mode: 'Bank Transfer',
      month: monthName,
      year: parseInt(year, 10),
      basic: basic,
      hra: hra,
      allowances: allowances,
      bonus: bonus,
      reimbursements: reimbursements,
      other_earnings: otherEarnings,
      gross_salary: grossSalary,
      pf: pf,
      esi: esi,
      tax: tax,
      lop_days: lopInfo.lop_days,
      lop_amount: lopInfo.lop_amount,
      loan_deductions: loanDeduction,
      other_deductions: otherDeductions + loanDeduction,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      earnings_breakdown: earningsBreakdownList,
      deductions_breakdown: deductionsBreakdownList,
      bonus_ids: bonusInfo.items.map(b => b.id),
      reimbursement_ids: reimbInfo.items.map(c => c.id),
      loan_items: loanInfo.items
    };
  }

  /**
   * Generate Payroll for selected Scope (All / Dept / Individual)
   */
  static async generatePayroll({ month, year, scope = 'all', department_id = null, employee_id = null, created_by = 1 }) {
    if (!month || !year) {
      const err = new Error("Month and Year are required to generate payroll.");
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch eligible active employees
    let sql = "SELECT id, name, employee_id, department_id, salary FROM employees WHERE status = 'Active'";
    const params = [];

    if (scope === 'employee' && employee_id) {
      sql += " AND id = ?";
      params.push(employee_id);
    } else if (scope === 'department' && department_id) {
      sql += " AND department_id = ?";
      params.push(department_id);
    }

    const employees = await this.query(sql, params);

    if (employees.length === 0) {
      const err = new Error("No active employees found for the selected scope.");
      err.statusCode = 404;
      throw err;
    }

    // 2. Check for duplicate records
    const existingRecords = await this.query(`
      SELECT employee_id FROM payslips
      WHERE month = ? AND year = ? AND employee_id IN (${employees.map(() => '?').join(',')})
    `, [month, year, ...employees.map(e => e.id)]);

    const existingMap = new Set(existingRecords.map(r => r.employee_id));

    // If single employee scope and already generated, throw explicit message
    if (scope === 'employee' && existingMap.has(Number(employee_id))) {
      const err = new Error("Payroll has already been generated for this employee for the selected period.");
      err.statusCode = 400;
      throw err;
    }

    // 3. Create or find payroll_run
    let runId = null;
    const existingRun = await this.query(
      "SELECT id FROM payroll_runs WHERE period_month = ? AND period_year = ? LIMIT 1",
      [month, String(year)]
    );

    if (existingRun.length > 0) {
      runId = existingRun[0].id;
    } else {
      const newRun = await this.query(`
        INSERT INTO payroll_runs (period_month, period_year, status, total_employees, created_by, created_at)
        VALUES (?, ?, 'Generated', ?, ?, NOW())
      `, [month, String(year), employees.length, created_by]);
      runId = newRun.insertId;
    }

    // 4. Process each employee
    let generatedCount = 0;
    let skippedCount = 0;
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;
    const errors = [];

    for (const emp of employees) {
      if (existingMap.has(emp.id)) {
        skippedCount++;
        continue;
      }

      try {
        const p = await this.calculateEmployeePayroll(emp.id, month, year);

        await this.query(`
          INSERT INTO payslips (
            payroll_run_id, employee_id, month, year,
            basic, hra, allowances, bonus, other_earnings, gross_salary,
            pf, esi, tax, lop_days, lop_amount, other_deductions,
            total_deductions, net_salary, payment_mode, status,
            earnings_breakdown, deductions_breakdown, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Generated', ?, ?, ?, NOW(), NOW())
        `, [
          runId, p.employee_id, p.month, p.year,
          p.basic, p.hra, p.allowances, p.bonus, p.reimbursements + p.other_earnings, p.gross_salary,
          p.pf, p.esi, p.tax, p.lop_days, p.lop_amount, p.other_deductions,
          p.total_deductions, p.net_salary, p.payment_mode,
          JSON.stringify(p.earnings_breakdown), JSON.stringify(p.deductions_breakdown),
          `Calculated for ${month} ${year}`
        ]);

        generatedCount++;
        totalGross += p.gross_salary;
        totalNet += p.net_salary;
        totalDeductions += p.total_deductions;
      } catch (calcErr) {
        errors.push({ employee_id: emp.id, name: emp.name, error: calcErr.message });
      }
    }

    // 5. Update payroll_run totals
    if (generatedCount > 0) {
      await this.query(`
        UPDATE payroll_runs
        SET processed_employees = processed_employees + ?,
            gross_amount = gross_amount + ?,
            net_amount = net_amount + ?,
            total_deductions = total_deductions + ?,
            status = 'Generated'
        WHERE id = ?
      `, [generatedCount, totalGross, totalNet, totalDeductions, runId]);
    }

    if (generatedCount === 0 && skippedCount > 0) {
      const err = new Error("Payroll has already been generated for the selected employees for this period.");
      err.statusCode = 400;
      throw err;
    }

    return {
      success: true,
      message: `Successfully generated payroll for ${generatedCount} employee(s). ${skippedCount > 0 ? `(${skippedCount} skipped as already generated)` : ''}`,
      period: `${month} ${year}`,
      runId: runId,
      generatedCount: generatedCount,
      skippedCount: skippedCount,
      errors: errors
    };
  }

  /**
   * Transition record to Approved
   */
  static async approvePayroll(id) {
    const rows = await this.query("SELECT * FROM payslips WHERE id = ?", [id]);
    if (rows.length === 0) {
      const err = new Error("Payroll record not found");
      err.statusCode = 404;
      throw err;
    }

    const rec = rows[0];
    if (rec.status === 'Paid') {
      const err = new Error("Cannot approve a payroll record that is already paid.");
      err.statusCode = 400;
      throw err;
    }

    await this.query("UPDATE payslips SET status = 'Approved', updated_at = NOW() WHERE id = ?", [id]);
    return { success: true, message: "Payroll record approved successfully.", status: 'Approved' };
  }

  /**
   * Mark as Paid & Disbursed
   * Commits loan remaining amounts & marks bonuses/claims as processed
   */
  static async markPayrollPaid(id, payment_mode = 'Bank Transfer') {
    const rows = await this.query("SELECT * FROM payslips WHERE id = ?", [id]);
    if (rows.length === 0) {
      const err = new Error("Payroll record not found");
      err.statusCode = 404;
      throw err;
    }

    const rec = rows[0];
    if (rec.status === 'Paid') {
      return { success: true, message: "Payroll is already marked as paid.", status: 'Paid' };
    }

    // 1. Process breakdown deductions (Loan EMI remaining amount deduction)
    if (rec.deductions_breakdown) {
      try {
        const deductions = JSON.parse(rec.deductions_breakdown);
        for (const item of deductions) {
          if (item.type === 'Loan' && item.id) {
            const loanRows = await this.query("SELECT * FROM loans_advances WHERE id = ?", [item.id]);
            if (loanRows.length > 0) {
              const loan = loanRows[0];
              const remaining = loan.remaining_amount !== null && loan.remaining_amount !== undefined ? parseFloat(loan.remaining_amount) : parseFloat(loan.amount);
              const newRemaining = Math.max(0, remaining - parseFloat(item.amount || 0));
              const newStatus = newRemaining <= 0 ? 'Closed' : 'Active';
              await this.query("UPDATE loans_advances SET remaining_amount = ?, status = ? WHERE id = ?", [newRemaining, newStatus, item.id]);
            }
          }
        }
      } catch (e) {
        console.error("Error committing loan repayments:", e);
      }
    }

    // 2. Mark included bonuses as processed
    if (rec.earnings_breakdown) {
      try {
        const earnings = JSON.parse(rec.earnings_breakdown);
        for (const item of earnings) {
          if (item.type === 'Bonus' && item.id) {
            await this.query("UPDATE bonus_incentives SET status = 'Processed', processed_in_payslip_id = ? WHERE id = ?", [id, item.id]);
          } else if (item.type === 'Reimbursement' && item.id) {
            await this.query("UPDATE expense_claims SET status = 'Processed', processed_in_payslip_id = ? WHERE id = ?", [id, item.id]);
          }
        }
      } catch (e) {
        console.error("Error committing bonus/reimbursement status:", e);
      }
    }

    // 3. Update payslip record status
    await this.query(`
      UPDATE payslips 
      SET status = 'Paid', payment_mode = ?, payment_date = NOW(), updated_at = NOW() 
      WHERE id = ?
    `, [payment_mode, id]);

    return { success: true, message: "Payroll marked as paid successfully.", status: 'Paid' };
  }

  /**
   * Bulk Approve
   */
  static async bulkApprove({ month, year }) {
    await this.query(`
      UPDATE payslips
      SET status = 'Approved', updated_at = NOW()
      WHERE month = ? AND year = ? AND status IN ('Generated', 'Draft', 'Under Review')
    `, [month, year]);

    return { success: true, message: `All generated payroll records for ${month} ${year} approved.` };
  }

  /**
   * Bulk Mark Paid
   */
  static async bulkMarkPaid({ month, year, payment_mode = 'Bank Transfer' }) {
    const records = await this.query(`
      SELECT id FROM payslips
      WHERE month = ? AND year = ? AND status = 'Approved'
    `, [month, year]);

    for (const r of records) {
      await this.markPayrollPaid(r.id, payment_mode);
    }

    return { success: true, message: `Disbursed and marked ${records.length} payroll record(s) as paid for ${month} ${year}.` };
  }

  /**
   * Get single payslip with company branding & employee profile
   */
  static async getPayslipById(id) {
    const rows = await this.query(`
      SELECT 
        p.*,
        e.name as employee_name,
        e.email as employee_email,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        e.join_date,
        d.dept_name as department,
        des.role_name as designation
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE p.id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      const err = new Error("Payslip record not found.");
      err.statusCode = 404;
      throw err;
    }

    const payslip = rows[0];
    const company = await this.getCompanySettings();

    try {
      if (typeof payslip.earnings_breakdown === 'string') {
        payslip.earnings_breakdown = JSON.parse(payslip.earnings_breakdown);
      }
    } catch (e) {
      payslip.earnings_breakdown = [];
    }

    try {
      if (typeof payslip.deductions_breakdown === 'string') {
        payslip.deductions_breakdown = JSON.parse(payslip.deductions_breakdown);
      }
    } catch (e) {
      payslip.deductions_breakdown = [];
    }

    payslip.company = company;
    return payslip;
  }

  /**
   * List payroll records with filters and optional employee scoping
   */
  static async listPayroll({ month, year, department_id, status, search, page = 1, limit = 50, allowedEmployeeIds = null }) {
    let sql = `
      SELECT 
        p.*,
        e.name as employee_name,
        e.email as employee_email,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        e.join_date,
        d.dept_name as department,
        des.role_name as designation
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE 1=1
    `;
    const params = [];

    if (allowedEmployeeIds && Array.isArray(allowedEmployeeIds) && allowedEmployeeIds.length > 0) {
      sql += ` AND p.employee_id IN (${allowedEmployeeIds.map(() => '?').join(',')})`;
      params.push(...allowedEmployeeIds);
    }

    if (month && month !== 'All Months') {
      sql += " AND p.month = ?";
      params.push(month);
    }
    if (year && year !== 'All') {
      sql += " AND p.year = ?";
      params.push(parseInt(year, 10));
    }
    if (department_id && department_id !== 'All Departments') {
      sql += " AND (d.dept_name = ? OR e.department_id = ?)";
      params.push(department_id, department_id);
    }
    if (status && status !== 'All') {
      sql += " AND p.status = ?";
      params.push(status);
    }
    if (search && search.trim()) {
      sql += " AND (e.name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?)";
      const q = `%${search.trim()}%`;
      params.push(q, q, q);
    }

    sql += " ORDER BY p.id DESC";

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10), offset);

    const rows = await this.query(sql, params);
    return rows;
  }

  /**
   * Get logged in employee's payslips
   */
  static async getMyPayroll(employeeId) {
    const rows = await this.query(`
      SELECT 
        p.*,
        e.name as employee_name,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        e.join_date,
        d.dept_name as department,
        des.role_name as designation
      FROM payslips p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE p.employee_id = ?
      ORDER BY p.id DESC
    `, [employeeId]);

    const company = await this.getCompanySettings();

    return rows.map(r => ({
      ...r,
      company: company
    }));
  }

  /**
   * Get runs summary
   */
  static async getRuns() {
    const rows = await this.query("SELECT * FROM payroll_runs ORDER BY id DESC LIMIT 50");
    return rows;
  }
}

module.exports = PayrollService;
