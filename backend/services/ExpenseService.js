const db = require('../config/database');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

class ExpenseService {
  // ─── EXPENSE CATEGORIES ───
  static async createCategory(data, userId) {
    const sql = 'INSERT INTO expense_categories (name, description, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?)';
    const res = await query(sql, [data.name.trim(), data.description || null, data.status || 'Active', userId, userId]);
    return { id: res.insertId };
  }

  static async updateCategory(id, data, userId) {
    const sql = 'UPDATE expense_categories SET name = ?, description = ?, status = ?, updated_by = ? WHERE id = ?';
    await query(sql, [data.name.trim(), data.description || null, data.status, userId, id]);
    return true;
  }

  static async deleteCategory(id) {
    await query('DELETE FROM expense_categories WHERE id = ?', [id]);
    return true;
  }

  static async listCategories(filters = {}) {
    let sql = 'SELECT * FROM expense_categories WHERE 1=1';
    const params = [];
    if (filters.search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  // ─── EXPENSE CLAIMS ───
  static async createClaim(data, userId) {
    const sql = `
      INSERT INTO expense_claims (
        title, employee_id, category_id, amount, date, payment_method, receipt, description, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.title.trim(), data.employee_id, data.category_id, parseFloat(data.amount) || 0,
      data.date, data.payment_method || 'Reimbursement', data.receipt || null, data.description || null,
      data.status || 'Pending', userId, userId
    ];
    const res = await query(sql, params);
    return { id: res.insertId };
  }

  static async updateClaim(id, data, userId) {
    const sql = `
      UPDATE expense_claims SET
        title = ?, employee_id = ?, category_id = ?, amount = ?, date = ?,
        payment_method = ?, receipt = ?, description = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.title.trim(), data.employee_id, data.category_id, parseFloat(data.amount) || 0,
      data.date, data.payment_method || 'Reimbursement', data.receipt || null, data.description || null,
      data.status, userId, id
    ];
    await query(sql, params);
    return true;
  }

  static async deleteClaim(id) {
    await query('DELETE FROM reimbursements WHERE claim_id = ?', [id]);
    await query('DELETE FROM expense_claims WHERE id = ?', [id]);
    return true;
  }

  static async listClaims(filters = {}) {
    let sql = `
      SELECT ec.*,
             e.name as employee_name,
             d.dept_name as department_name,
             cat.name as category_name
      FROM expense_claims ec
      JOIN employees e ON ec.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN expense_categories cat ON ec.category_id = cat.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.search) {
      sql += ' AND (ec.title LIKE ? OR e.name LIKE ? OR cat.name LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    if (filters.status) {
      sql += ' AND ec.status = ?';
      params.push(filters.status);
    }
    if (filters.department_id) {
      sql += ' AND e.department_id = ?';
      params.push(filters.department_id);
    }
    sql += ' ORDER BY ec.created_at DESC';
    return await query(sql, params);
  }

  static async approveClaim(id, status, userId) {
    await query('UPDATE expense_claims SET status = ?, updated_by = ? WHERE id = ?', [status, userId, id]);
    // If approved, automatically create a pending reimbursement entry
    if (status === 'Approved') {
      const existing = await query('SELECT 1 FROM reimbursements WHERE claim_id = ?', [id]);
      if (existing.length === 0) {
        await query('INSERT INTO reimbursements (claim_id, status, created_by, updated_by) VALUES (?, ?, ?, ?)', [id, 'Pending', userId, userId]);
      }
    }
    return true;
  }

  // ─── REIMBURSEMENTS ───
  static async listReimbursements(filters = {}) {
    let sql = `
      SELECT r.*,
             ec.title as claim_title,
             ec.amount as amount,
             ec.date as claim_date,
             ec.description as purpose,
             e.name as employee_name,
             d.dept_name as department_name
      FROM reimbursements r
      JOIN expense_claims ec ON r.claim_id = ec.id
      JOIN employees e ON ec.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.search) {
      sql += ' AND (e.name LIKE ? OR ec.title LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term);
    }
    if (filters.status) {
      sql += ' AND r.status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY r.created_at DESC';
    return await query(sql, params);
  }

  static async processReimbursement(id, data, userId) {
    const sql = `
      UPDATE reimbursements SET
        payment_method = ?, transaction_id = ?, paid_date = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await query(sql, [
      data.payment_method || 'Bank Transfer', data.transaction_id || null,
      data.paid_date || new Date().toISOString().slice(0,10), data.status || 'Paid', userId, id
    ]);
    return true;
  }

  // ─── META / DROPDOWNS ───
  static async getMeta() {
    const employees = await query('SELECT id, name FROM employees WHERE status="Active" ORDER BY name');
    const categories = await query('SELECT id, name FROM expense_categories WHERE status="Active" ORDER BY name');
    const departments = await query('SELECT id, dept_name as name FROM departments ORDER BY dept_name');
    return { employees, categories, departments };
  }

  // ─── DASHBOARD ───
  static async getDashboard() {
    const totalRow = await query('SELECT COUNT(*) as c FROM expense_claims');
    const pendingRow = await query("SELECT COUNT(*) as c FROM expense_claims WHERE status = 'Pending'");
    const approvedRow = await query("SELECT COUNT(*) as c FROM expense_claims WHERE status = 'Approved'");
    const rejectedRow = await query("SELECT COUNT(*) as c FROM expense_claims WHERE status = 'Rejected'");
    const reimbRow = await query("SELECT COALESCE(SUM(ec.amount), 0) as c FROM reimbursements r JOIN expense_claims ec ON r.claim_id = ec.id WHERE r.status='Paid'");

    const totalClaims = totalRow[0].c || 0;
    const pendingClaims = pendingRow[0].c || 0;
    const approvedClaims = approvedRow[0].c || 0;
    const rejectedClaims = rejectedRow[0].c || 0;
    const totalReimbursement = reimbRow[0].c || 0;

    // Monthly expenses
    const monthlyTrend = await query(`
      SELECT DATE_FORMAT(date, '%b %Y') as month, SUM(amount) as amount
      FROM expense_claims
      GROUP BY DATE_FORMAT(date, '%b %Y')
      ORDER BY MIN(date) DESC
      LIMIT 6
    `);

    // Category distribution
    const catStats = await query(`
      SELECT cat.name, SUM(ec.amount) as value
      FROM expense_claims ec
      JOIN expense_categories cat ON ec.category_id = cat.id
      GROUP BY cat.id, cat.name
    `);
    const totalCatAmt = catStats.reduce((s, r) => s + parseFloat(r.value), 0);
    const colors = ['#2563EB', '#10B981', '#3B82F6', '#F59E0B', '#818CF8', '#9CA3AF'];
    const categoryPie = catStats.map((r, i) => ({
      name: r.name,
      value: parseFloat(r.value) || 0,
      percent: totalCatAmt > 0 ? `${((r.value / totalCatAmt) * 100).toFixed(1)}%` : '0%',
      color: colors[i % colors.length]
    }));

    // Department horizontal bars
    const deptStats = await query(`
      SELECT COALESCE(d.dept_name, 'Unassigned') as name, SUM(ec.amount) as amount
      FROM expense_claims ec
      JOIN employees e ON ec.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      GROUP BY d.id, d.dept_name
    `);

    return {
      kpis: { totalClaims, pendingClaims, approvedClaims, rejectedClaims, totalReimbursement },
      monthlyTrend: monthlyTrend.reverse(),
      categoryPie,
      deptStats: deptStats.map(r => ({ name: r.name, amount: parseFloat(r.amount) || 0, formatted: `₹ ${parseFloat(r.amount).toLocaleString('en-IN')}` }))
    };
  }

  // ─── REPORTS ───
  static async getReports(filters = {}) {
    let sql = `
      SELECT ec.*,
             e.name as employee_name,
             d.dept_name as department_name,
             cat.name as category_name
      FROM expense_claims ec
      JOIN employees e ON ec.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      JOIN expense_categories cat ON ec.category_id = cat.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.category_id) {
      sql += ' AND ec.category_id = ?';
      params.push(filters.category_id);
    }
    if (filters.department_id) {
      sql += ' AND e.department_id = ?';
      params.push(filters.department_id);
    }
    if (filters.status) {
      sql += ' AND ec.status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY ec.date DESC';
    return await query(sql, params);
  }
}

module.exports = ExpenseService;
