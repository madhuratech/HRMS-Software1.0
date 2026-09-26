const PayrollService = require('../services/PayrollService');
const PayslipPdfService = require('../services/PayslipPdfService');
const db = require('../config/database');

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

// ====================================================================
// Helper to resolve current authenticated employee's DB ID
async function resolveCurrentEmployeeId(req) {
  let empId = req.headers['x-employee-id'] || (req.user && (req.user.employee_id || req.user.id));
  const userEmail = (req.user && req.user.email) || null;
  
  if (empId || userEmail) {
    const empRows = await dbQuery(
      "SELECT e.id FROM employees e LEFT JOIN users u ON (u.employee_id = e.id OR u.email = e.email) WHERE e.id = ? OR u.id = ? OR u.employee_id = ? OR e.email = ? ORDER BY (e.id = ?) DESC LIMIT 1",
      [empId || 0, empId || 0, empId || 0, userEmail || '', empId || 0]
    );
    if (empRows && empRows.length > 0) {
      return empRows[0].id;
    }
  }
  return empId || null;
}

// ====================================================================
// 1. PAYROLL RUNS & GENERATION
// ====================================================================

exports.list = async (req, res) => {
  try {
    const { month, year, department_id, status, search, page, limit } = req.query;

    const userRole = (req.headers && req.headers['x-user-role']) || (req.user && req.user.role) || 'EMPLOYEE';
    const normRole = String(userRole).toUpperCase().replace(/[\s_-]+/g, '');

    let allowedEmployeeIds = null;

    // Strict privacy rule: EMPLOYEE and TEAM_LEADER can ONLY see their own payslips
    if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(normRole)) {
      const currentEmpId = await resolveCurrentEmployeeId(req);
      allowedEmployeeIds = currentEmpId ? [currentEmpId] : [-1];
    }

    const records = await PayrollService.listPayroll({ 
      month, 
      year, 
      department_id, 
      status, 
      search, 
      page, 
      limit,
      allowedEmployeeIds 
    });
    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (err) {
    console.error("Error in payrollController.list:", err);
    return res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

exports.generate = async (req, res) => {
  try {
    const { month, year, scope, department_id, employee_id } = req.body;
    const created_by = req.user ? req.user.id : 1;
    const result = await PayrollService.generatePayroll({ month, year, scope, department_id, employee_id, created_by });
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in payrollController.generate:", err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await PayrollService.getPayslipById(id);

    const userRole = (req.headers && req.headers['x-user-role']) || (req.user && req.user.role) || 'EMPLOYEE';
    const normRole = String(userRole).toUpperCase().replace(/[\s_-]+/g, '');

    if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(normRole)) {
      const currentEmpId = await resolveCurrentEmployeeId(req);
      if (Number(payslip.employee_id) !== Number(currentEmpId)) {
        return res.status(403).json({ success: false, message: "Access Denied: You are not authorized to view this payslip." });
      }
    }

    return res.status(200).json({ success: true, data: payslip });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { basic, hra, allowances, other_earnings, other_deductions, notes, status } = req.body;

    const fields = [];
    const params = [];

    if (basic !== undefined) { fields.push('basic = ?'); params.push(basic); }
    if (hra !== undefined) { fields.push('hra = ?'); params.push(hra); }
    if (allowances !== undefined) { fields.push('allowances = ?'); params.push(allowances); }
    if (other_earnings !== undefined) { fields.push('other_earnings = ?'); params.push(other_earnings); }
    if (other_deductions !== undefined) { fields.push('other_deductions = ?'); params.push(other_deductions); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update provided." });
    }

    fields.push('updated_at = NOW()');
    params.push(id);

    await dbQuery(`UPDATE payslips SET ${fields.join(', ')} WHERE id = ?`, params);
    return res.status(200).json({ success: true, message: "Payroll record updated successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await PayrollService.approvePayroll(id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_mode } = req.body;
    const result = await PayrollService.markPayrollPaid(id, payment_mode);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.bulkApprove = async (req, res) => {
  try {
    const { month, year } = req.body;
    const result = await PayrollService.bulkApprove({ month, year });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkMarkPaid = async (req, res) => {
  try {
    const { month, year, payment_mode } = req.body;
    const result = await PayrollService.bulkMarkPaid({ month, year, payment_mode });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await PayrollService.getPayslipById(id);

    const userRole = (req.headers && req.headers['x-user-role']) || (req.user && req.user.role) || 'EMPLOYEE';
    const normRole = String(userRole).toUpperCase().replace(/[\s_-]+/g, '');

    if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(normRole)) {
      const currentEmpId = await resolveCurrentEmployeeId(req);
      if (Number(payslip.employee_id) !== Number(currentEmpId)) {
        return res.status(403).json({ success: false, message: "Access Denied: You are not authorized to view this payslip." });
      }
    }

    return res.status(200).json({ success: true, data: payslip });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.downloadPayslipPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await PayrollService.getPayslipById(id);

    const userRole = (req.headers && req.headers['x-user-role']) || (req.user && req.user.role) || 'EMPLOYEE';
    const normRole = String(userRole).toUpperCase().replace(/[\s_-]+/g, '');

    if (['EMPLOYEE', 'STAFF', 'SERVICE_STAFF', 'TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(normRole)) {
      const currentEmpId = await resolveCurrentEmployeeId(req);
      if (Number(payslip.employee_id) !== Number(currentEmpId)) {
        return res.status(403).json({ success: false, message: "Access Denied: You are not authorized to view this payslip." });
      }
    }

    const empCode = payslip.employee_code || payslip.emp_code || (payslip.employee_id ? `EMP${String(payslip.employee_id).padStart(4, '0')}` : 'EMP');
    const safeMonth = (payslip.month || 'Month').replace(/[^a-zA-Z0-9]/g, '');
    const safeYear = payslip.year || new Date().getFullYear();
    const filename = `Payslip_${empCode}_${safeMonth}_${safeYear}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    PayslipPdfService.generatePdfStream(payslip, res);
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

exports.getMyPayroll = async (req, res) => {
  try {
    const currentEmpId = await resolveCurrentEmployeeId(req);
    if (!currentEmpId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const result = await PayrollService.getMyPayroll(currentEmpId);
    return res.status(200).json({ success: true, count: result.length, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message, data: [] });
  }
};

exports.getRuns = async (req, res) => {
  try {
    const runs = await PayrollService.getRuns();
    return res.status(200).json(runs);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.initializeRun = async (req, res) => {
  try {
    const { month, year } = req.body;
    const result = await dbQuery("INSERT INTO payroll_runs (period_month, period_year, status) VALUES (?, ?, 'Generated')", [month, year]);
    return res.status(200).json({ message: `Payroll run initialized for ${month} ${year}`, id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 2. SALARY COMPONENTS CRUD
// ====================================================================

exports.getComponents = async (req, res) => {
  try {
    const rows = await dbQuery("SELECT * FROM salary_components ORDER BY id ASC");
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json([]);
  }
};

exports.createComponent = async (req, res) => {
  try {
    const { name, type, taxable, formula, frequency, calc_type, percentage_value, percentage_basis, default_amount, status, is_statutory } = req.body;
    const result = await dbQuery(`
      INSERT INTO salary_components (
        name, type, taxable, formula, frequency, calc_type,
        percentage_value, percentage_basis, default_amount, status, is_statutory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, type, taxable || 'Yes', formula || null, frequency || 'Monthly',
      calc_type || 'fixed', percentage_value || 0, percentage_basis || 'basic',
      default_amount || 0, status || 'Active', is_statutory ? 1 : 0
    ]);
    return res.status(201).json({ success: true, message: "Salary component created successfully", id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, taxable, formula, frequency, calc_type, percentage_value, percentage_basis, default_amount, status, is_statutory } = req.body;
    await dbQuery(`
      UPDATE salary_components 
      SET name = ?, type = ?, taxable = ?, formula = ?, frequency = ?,
          calc_type = ?, percentage_value = ?, percentage_basis = ?, default_amount = ?,
          status = ?, is_statutory = ?
      WHERE id = ?
    `, [
      name, type, taxable, formula, frequency, calc_type,
      percentage_value, percentage_basis, default_amount, status, is_statutory ? 1 : 0, id
    ]);
    return res.status(200).json({ success: true, message: "Salary component updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;
    await dbQuery("DELETE FROM salary_components WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Salary component deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 3. SALARY STRUCTURES & ASSIGNMENTS
// ====================================================================

exports.getStructures = async (req, res) => {
  try {
    const structures = await dbQuery(`
      SELECT 
        ss.*,
        COUNT(DISTINCT esm.employee_id) as employees
      FROM salary_structures ss
      LEFT JOIN employee_salary_mappings esm ON ss.id = esm.structure_id
      GROUP BY ss.id
      ORDER BY ss.id DESC
    `);
    return res.status(200).json(structures);
  } catch (err) {
    console.error("Error in getStructures:", err);
    return res.status(500).json([]);
  }
};

exports.getStructureById = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await dbQuery("SELECT * FROM salary_structures WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Structure not found" });

    const structure = rows[0];
    const components = await dbQuery(`
      SELECT ssc.*, sc.name as component_name, sc.type as component_type
      FROM salary_structure_components ssc
      LEFT JOIN salary_components sc ON ssc.component_id = sc.id
      WHERE ssc.structure_id = ?
    `, [id]);

    structure.components = components;
    return res.status(200).json({ success: true, data: structure });
  } catch (err) {
    console.error("Error in getStructureById:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createStructure = async (req, res) => {
  try {
    // 1. Canonicalize and validate fields
    const name = (req.body.name || req.body.structureName || req.body.structure_name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Structure name is required." });
    }

    const frequency = req.body.frequency || req.body.payFrequency || 'Monthly';
    const rawCtc = req.body.total_ctc !== undefined ? req.body.total_ctc : (req.body.totalCtc !== undefined ? req.body.totalCtc : (req.body.amount !== undefined ? req.body.amount : 0));
    const totalCtc = parseFloat(rawCtc);
    if (isNaN(totalCtc) || totalCtc < 0) {
      return res.status(400).json({ success: false, message: "Total CTC must be a valid non-negative number." });
    }

    const status = req.body.status || 'Active';

    // Unique code generation/cleaning
    let code = (req.body.code || req.body.structureCode || req.body.structure_code || '').trim();
    if (!code) {
      code = `STR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Check duplicate code
    const existingCode = await dbQuery("SELECT id FROM salary_structures WHERE code = ? LIMIT 1", [code]);
    if (existingCode.length > 0) {
      return res.status(409).json({ success: false, message: `A salary structure with code '${code}' already exists.` });
    }

    // 2. Validate components relationship
    const rawComponents = req.body.components || req.body.salaryComponents || req.body.salary_components || [];
    if (!Array.isArray(rawComponents)) {
      return res.status(400).json({ success: false, message: "Components must be provided as an array." });
    }

    const normalizedComponents = [];
    for (const comp of rawComponents) {
      const compId = parseInt(comp.component_id !== undefined ? comp.component_id : (comp.componentId !== undefined ? comp.componentId : comp.id), 10);
      if (isNaN(compId) || compId <= 0) {
        return res.status(400).json({ success: false, message: "Each attached component must have a valid componentId." });
      }

      const val = parseFloat(comp.value !== undefined ? comp.value : (comp.default_amount !== undefined ? comp.default_amount : (comp.amount !== undefined ? comp.amount : 0))) || 0;
      normalizedComponents.push({
        component_id: compId,
        calc_type: comp.calc_type || comp.calcType || 'percentage',
        value: val,
        percentage_basis: comp.percentage_basis || comp.percentageBasis || 'basic'
      });
    }

    // Check that all component IDs exist in salary_components
    if (normalizedComponents.length > 0) {
      const distinctCompIds = [...new Set(normalizedComponents.map(c => c.component_id))];
      const foundComps = await dbQuery("SELECT id FROM salary_components WHERE id IN (?)", [distinctCompIds]);
      if (foundComps.length !== distinctCompIds.length) {
        return res.status(404).json({ success: false, message: "One or more selected salary components do not exist in the database." });
      }
    }

    // 3. Transaction handling: Structure + Components
    const conn = await new Promise((resolve, reject) => {
      db.getConnection((err, connection) => {
        if (err) return reject(err);
        resolve(connection);
      });
    });

    const connQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    };

    try {
      await connQuery("START TRANSACTION");

      const result = await connQuery(`
        INSERT INTO salary_structures (name, code, frequency, total_ctc, status, created_at)
        VALUES (?, ?, ?, ?, ?, CURDATE())
      `, [name, code, frequency, totalCtc, status]);

      const structureId = result.insertId;

      for (const comp of normalizedComponents) {
        await connQuery(`
          INSERT INTO salary_structure_components (structure_id, component_id, calc_type, value, percentage_basis)
          VALUES (?, ?, ?, ?, ?)
        `, [structureId, comp.component_id, comp.calc_type, comp.value, comp.percentage_basis]);
      }

      await connQuery("COMMIT");
      conn.release();

      return res.status(201).json({
        success: true,
        message: "Salary structure created successfully",
        id: structureId,
        data: { id: structureId, name, code, frequency, total_ctc: totalCtc, status }
      });
    } catch (txErr) {
      try {
        await connQuery("ROLLBACK");
      } catch (rbErr) {
        console.error("Rollback error:", rbErr);
      }
      conn.release();
      console.error("Transaction error in createStructure:", txErr);
      if (txErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: `A salary structure with code '${code}' already exists.` });
      }
      return res.status(500).json({ success: false, message: txErr.message || "Failed to create salary structure." });
    }
  } catch (err) {
    console.error("Error in createStructure:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error." });
  }
};

exports.updateStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbQuery("SELECT * FROM salary_structures WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Salary structure not found." });
    }

    const name = (req.body.name || req.body.structureName || req.body.structure_name || existing[0].name).trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Structure name is required." });
    }

    const frequency = req.body.frequency || req.body.payFrequency || existing[0].frequency || 'Monthly';
    const rawCtc = req.body.total_ctc !== undefined ? req.body.total_ctc : (req.body.totalCtc !== undefined ? req.body.totalCtc : (req.body.amount !== undefined ? req.body.amount : existing[0].total_ctc));
    const totalCtc = parseFloat(rawCtc);
    const status = req.body.status || existing[0].status || 'Active';
    const code = (req.body.code || req.body.structureCode || req.body.structure_code || existing[0].code).trim();

    // Check duplicate code on other structures
    const dupCheck = await dbQuery("SELECT id FROM salary_structures WHERE code = ? AND id != ? LIMIT 1", [code, id]);
    if (dupCheck.length > 0) {
      return res.status(409).json({ success: false, message: `A salary structure with code '${code}' already exists.` });
    }

    const rawComponents = req.body.components || req.body.salaryComponents || req.body.salary_components;
    let normalizedComponents = null;

    if (Array.isArray(rawComponents)) {
      normalizedComponents = [];
      for (const comp of rawComponents) {
        const compId = parseInt(comp.component_id !== undefined ? comp.component_id : (comp.componentId !== undefined ? comp.componentId : comp.id), 10);
        if (isNaN(compId) || compId <= 0) {
          return res.status(400).json({ success: false, message: "Each attached component must have a valid componentId." });
        }
        const val = parseFloat(comp.value !== undefined ? comp.value : (comp.default_amount !== undefined ? comp.default_amount : (comp.amount !== undefined ? comp.amount : 0))) || 0;
        normalizedComponents.push({
          component_id: compId,
          calc_type: comp.calc_type || comp.calcType || 'percentage',
          value: val,
          percentage_basis: comp.percentage_basis || comp.percentageBasis || 'basic'
        });
      }

      if (normalizedComponents.length > 0) {
        const distinctCompIds = [...new Set(normalizedComponents.map(c => c.component_id))];
        const foundComps = await dbQuery("SELECT id FROM salary_components WHERE id IN (?)", [distinctCompIds]);
        if (foundComps.length !== distinctCompIds.length) {
          return res.status(404).json({ success: false, message: "One or more selected salary components do not exist in the database." });
        }
      }
    }

    // Transaction for update
    const conn = await new Promise((resolve, reject) => {
      db.getConnection((err, connection) => {
        if (err) return reject(err);
        resolve(connection);
      });
    });

    const connQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    };

    try {
      await connQuery("START TRANSACTION");

      await connQuery(`
        UPDATE salary_structures 
        SET name = ?, code = ?, frequency = ?, total_ctc = ?, status = ?
        WHERE id = ?
      `, [name, code, frequency, totalCtc, status, id]);

      if (normalizedComponents !== null) {
        await connQuery("DELETE FROM salary_structure_components WHERE structure_id = ?", [id]);
        for (const comp of normalizedComponents) {
          await connQuery(`
            INSERT INTO salary_structure_components (structure_id, component_id, calc_type, value, percentage_basis)
            VALUES (?, ?, ?, ?, ?)
          `, [id, comp.component_id, comp.calc_type, comp.value, comp.percentage_basis]);
        }
      }

      await connQuery("COMMIT");
      conn.release();

      return res.status(200).json({ success: true, message: "Salary structure updated successfully" });
    } catch (txErr) {
      try {
        await connQuery("ROLLBACK");
      } catch (rbErr) {
        console.error("Rollback error:", rbErr);
      }
      conn.release();
      console.error("Transaction error in updateStructure:", txErr);
      if (txErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: `A salary structure with code '${code}' already exists.` });
      }
      return res.status(500).json({ success: false, message: txErr.message || "Failed to update salary structure." });
    }
  } catch (err) {
    console.error("Error in updateStructure:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error." });
  }
};

exports.deleteStructure = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbQuery("SELECT id FROM salary_structures WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Salary structure not found." });
    }

    const conn = await new Promise((resolve, reject) => {
      db.getConnection((err, connection) => {
        if (err) return reject(err);
        resolve(connection);
      });
    });

    const connQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    };

    try {
      await connQuery("START TRANSACTION");
      await connQuery("DELETE FROM salary_structure_components WHERE structure_id = ?", [id]);
      await connQuery("DELETE FROM employee_salary_mappings WHERE structure_id = ?", [id]);
      await connQuery("DELETE FROM salary_structures WHERE id = ?", [id]);
      await connQuery("COMMIT");
      conn.release();

      return res.status(200).json({ success: true, message: "Salary structure deleted successfully" });
    } catch (txErr) {
      try {
        await connQuery("ROLLBACK");
      } catch (rbErr) {}
      conn.release();
      console.error("Transaction error in deleteStructure:", txErr);
      return res.status(500).json({ success: false, message: txErr.message || "Failed to delete salary structure." });
    }
  } catch (err) {
    console.error("Error in deleteStructure:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignStructure = async (req, res) => {
  try {
    const { employee_id, structure_id, effective_from, custom_gross } = req.body;
    if (!employee_id || !structure_id) {
      return res.status(400).json({ success: false, message: "Employee and Structure are required." });
    }

    // Check if exists
    const existing = await dbQuery("SELECT * FROM employee_salary_mappings WHERE employee_id = ?", [employee_id]);
    if (existing.length > 0) {
      await dbQuery(`
        UPDATE employee_salary_mappings 
        SET structure_id = ?, effective_from = ?, custom_gross = ?, assigned_date = NOW()
        WHERE employee_id = ?
      `, [structure_id, effective_from || null, custom_gross || null, employee_id]);
    } else {
      await dbQuery(`
        INSERT INTO employee_salary_mappings (employee_id, structure_id, effective_from, custom_gross, assigned_date, created_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [employee_id, structure_id, effective_from || null, custom_gross || null]);
    }

    // Also sync to employees.salary if custom_gross provided
    if (custom_gross && parseFloat(custom_gross) > 0) {
      await dbQuery("UPDATE employees SET salary = ? WHERE id = ?", [custom_gross, employee_id]);
    }

    return res.status(200).json({ success: true, message: "Salary structure successfully assigned to employee." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 4. BONUS & INCENTIVES
// ====================================================================

exports.getBonuses = async (req, res) => {
  try {
    const sql = `
      SELECT 
        b.*,
        e.name as employeeName,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        COALESCE(d.dept_name, 'General') as department,
        b.bonus_type as type,
        DATE_FORMAT(b.created_at, '%d %b %Y') as date
      FROM bonus_incentives b
      JOIN employees e ON b.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY b.id DESC
    `;
    const rows = await dbQuery(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json([]);
  }
};

exports.createBonus = async (req, res) => {
  try {
    const { employee_id, bonus_type, amount, reason, applicable_month, applicable_year } = req.body;
    if (!employee_id || !amount) {
      return res.status(400).json({ success: false, message: "Employee and Amount are required." });
    }

    const result = await dbQuery(`
      INSERT INTO bonus_incentives (employee_id, bonus_type, amount, reason, applicable_month, applicable_year, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Approved', NOW())
    `, [employee_id, bonus_type || 'Performance Bonus', amount, reason || null, applicable_month || null, applicable_year || null]);

    return res.status(201).json({ success: true, message: "Bonus / Incentive added successfully.", id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateBonusStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await dbQuery("UPDATE bonus_incentives SET status = ? WHERE id = ?", [status, id]);
    return res.status(200).json({ success: true, message: `Bonus status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 5. REIMBURSEMENTS
// ====================================================================

exports.getReimbursements = async (req, res) => {
  try {
    const sql = `
      SELECT 
        c.*,
        e.name as employee_name,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        d.dept_name as department,
        COALESCE(cat.name, 'General Expense') as category_name
      FROM expense_claims c
      JOIN employees e ON c.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN expense_categories cat ON c.category_id = cat.id
      ORDER BY c.id DESC
    `;
    const rows = await dbQuery(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json([]);
  }
};

exports.createReimbursement = async (req, res) => {
  try {
    const { employee_id, category_id, title, amount, date, description, receipt } = req.body;
    const result = await dbQuery(`
      INSERT INTO expense_claims (employee_id, category_id, title, amount, date, description, receipt, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Approved', NOW(), NOW())
    `, [employee_id, category_id || null, title || 'Travel Expense', amount, date || new Date(), description || '', receipt || '']);
    return res.status(201).json({ success: true, message: "Expense reimbursement claim created.", id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateReimbursementStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await dbQuery("UPDATE expense_claims SET status = ?, updated_at = NOW() WHERE id = ?", [status, id]);
    return res.status(200).json({ success: true, message: `Claim status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 6. LOANS & ADVANCES
// ====================================================================

exports.getLoans = async (req, res) => {
  try {
    const sql = `
      SELECT 
        l.*,
        e.name as employee_name,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        d.dept_name as department
      FROM loans_advances l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY l.id DESC
    `;
    const rows = await dbQuery(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json([]);
  }
};

exports.createLoan = async (req, res) => {
  try {
    const { employee_id, type, amount, tenure_months, emi, start_date } = req.body;
    const calcEmi = emi || (tenure_months > 0 ? (amount / tenure_months) : amount);
    const result = await dbQuery(`
      INSERT INTO loans_advances (employee_id, type, amount, tenure_months, emi, remaining_amount, start_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', NOW())
    `, [employee_id, type || 'Personal Loan', amount, tenure_months || 12, calcEmi, amount, start_date || new Date()]);

    return res.status(201).json({ success: true, message: "Loan / Advance created successfully.", id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await dbQuery("UPDATE loans_advances SET status = ? WHERE id = ?", [status, id]);
    return res.status(200).json({ success: true, message: `Loan status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 7. TAX MANAGEMENT
// ====================================================================

exports.getTaxes = async (req, res) => {
  try {
    const sql = `
      SELECT 
        t.*,
        e.name as employee_name,
        COALESCE(e.employee_id, CONCAT('EMP', LPAD(e.id, 4, '0'))) as emp_code,
        e.salary as employee_salary,
        d.dept_name as department
      FROM tax_declarations t
      JOIN employees e ON t.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY t.id DESC
    `;
    const rows = await dbQuery(sql);
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json([]);
  }
};

exports.createTax = async (req, res) => {
  try {
    const { employee_id, tax_regime, section_80c, section_80d, hra_exemption, financial_year } = req.body;
    const existing = await dbQuery("SELECT id FROM tax_declarations WHERE employee_id = ?", [employee_id]);
    if (existing.length > 0) {
      await dbQuery(`
        UPDATE tax_declarations 
        SET tax_regime = ?, section_80c = ?, section_80d = ?, hra_exemption = ?, financial_year = ?, status = 'Declared'
        WHERE employee_id = ?
      `, [tax_regime || 'New Regime', section_80c || 0, section_80d || 0, hra_exemption || 0, financial_year || '2026-27', employee_id]);
    } else {
      await dbQuery(`
        INSERT INTO tax_declarations (employee_id, tax_regime, section_80c, section_80d, hra_exemption, financial_year, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'Declared', NOW())
      `, [employee_id, tax_regime || 'New Regime', section_80c || 0, section_80d || 0, hra_exemption || 0, financial_year || '2026-27']);
    }
    return res.status(200).json({ success: true, message: "Tax declaration saved successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyTax = async (req, res) => {
  try {
    const { id } = req.params;
    await dbQuery("UPDATE tax_declarations SET status = 'Verified' WHERE id = ?", [id]);
    return res.status(200).json({ success: true, message: "Tax declaration marked as Verified." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ====================================================================
// 8. REPORTS
// ====================================================================

exports.getReports = async (req, res) => {
  try {
    const totalRows = await dbQuery("SELECT COALESCE(SUM(total_ctc), 0) as total FROM salary_structures WHERE status = 'Active'");
    const totalSalary = totalRows[0]?.total || 0;

    const deptRows = await dbQuery(`
      SELECT d.dept_name as dept, COALESCE(SUM(s.total_ctc), 0) as Salary
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      LEFT JOIN salary_structures s ON s.id = e.designation_id
      GROUP BY d.id, d.dept_name
    `);

    return res.json({
      totalPayroll: totalSalary,
      ytdGross: totalSalary * 12,
      ytdDeductions: Math.round(totalSalary * 0.15 * 12),
      ytdNet: Math.round(totalSalary * 0.85 * 12),
      departmentSalaries: (deptRows && deptRows.length > 0) ? deptRows : []
    });
  } catch (err) {
    return res.status(500).json({ totalPayroll: 0, ytdGross: 0, ytdDeductions: 0, ytdNet: 0, departmentSalaries: [] });
  }
};
