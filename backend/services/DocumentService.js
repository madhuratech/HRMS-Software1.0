const db = require('../config/database');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

class DocumentService {
  // ─── EMPLOYEE DOCUMENTS ───
  static async createEmployeeDoc(data, userId) {
    const sql = `
      INSERT INTO employee_documents (employee_id, document_type, document_name, expiry_date, file, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.employee_id, data.document_type, data.document_name.trim(),
      data.expiry_date || null, data.file || null, data.status || 'Pending', userId, userId
    ];
    const res = await query(sql, params);
    return { id: res.insertId };
  }

  static async updateEmployeeDoc(id, data, userId) {
    const sql = `
      UPDATE employee_documents SET
        employee_id = ?, document_type = ?, document_name = ?, expiry_date = ?, file = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await query(sql, [
      data.employee_id, data.document_type, data.document_name.trim(),
      data.expiry_date || null, data.file || null, data.status, userId, id
    ]);
    return true;
  }

  static async deleteEmployeeDoc(id) {
    await query('DELETE FROM employee_documents WHERE id = ?', [id]);
    return true;
  }

  static async listEmployeeDocs(filters = {}) {
    let sql = `
      SELECT ed.*, e.name as employee_name, des.role_name as employee_role
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.search) {
      sql += ' AND (ed.document_name LIKE ? OR e.name LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term);
    }
    if (filters.document_type && filters.document_type !== 'all') {
      sql += ' AND ed.document_type = ?';
      params.push(filters.document_type);
    }
    sql += ' ORDER BY ed.created_at DESC';
    return await query(sql, params);
  }

  // ─── COMPANY DOCUMENTS ───
  static async createCompanyDoc(data, userId) {
    const sql = `
      INSERT INTO company_documents (company_id, document_name, document_category, document_path, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.company_id || null, data.document_name.trim(), data.document_category, data.document_path, data.status || 'Active', userId, userId
    ];
    const res = await query(sql, params);
    return { id: res.insertId };
  }

  static async updateCompanyDoc(id, data, userId) {
    const sql = `
      UPDATE company_documents SET
        company_id = ?, document_name = ?, document_category = ?, document_path = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await query(sql, [
      data.company_id || null, data.document_name.trim(), data.document_category, data.document_path, data.status, userId, id
    ]);
    return true;
  }

  static async deleteCompanyDoc(id) {
    await query('DELETE FROM company_documents WHERE id = ?', [id]);
    return true;
  }

  static async listCompanyDocs(filters = {}) {
    let sql = `
      SELECT cd.*, cp.company_name as company_name
      FROM company_documents cd
      LEFT JOIN company_profile cp ON cd.company_id = cp.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.search) {
      sql += ' AND (cd.document_name LIKE ? OR cd.document_category LIKE ? OR cp.company_name LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    if (filters.category && filters.category !== 'all') {
      sql += ' AND cd.document_category = ?';
      params.push(filters.category);
    }
    if (filters.company_id) {
      sql += ' AND cd.company_id = ?';
      params.push(filters.company_id);
    }
    sql += ' ORDER BY cd.created_at DESC';
    return await query(sql, params);
  }

  // ─── HR POLICIES ───
  static async createPolicy(data, userId) {
    const sql = `
      INSERT INTO hr_policies (policy_name, category, version, effective_date, file, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.policy_name.trim(), data.category, data.version || '1.0', data.effective_date || null, data.file || null, data.status || 'Draft', userId, userId
    ];
    const res = await query(sql, params);
    return { id: res.insertId };
  }

  static async updatePolicy(id, data, userId) {
    const sql = `
      UPDATE hr_policies SET
        policy_name = ?, category = ?, version = ?, effective_date = ?, file = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await query(sql, [
      data.policy_name.trim(), data.category, data.version, data.effective_date || null, data.file || null, data.status, userId, id
    ]);
    return true;
  }

  // ─── TEMPLATES ───
  static async createTemplate(data, userId) {
    const sql = `
      INSERT INTO document_templates (
        template_name, category, description, template_source_type,
        original_file_name, file_path, file_type, file_size,
        content, status, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.template_name ? data.template_name.trim() : '',
      data.category || 'Offer Letters',
      data.description || null,
      data.template_source_type || 'editor',
      data.original_file_name || null,
      data.file_path || null,
      data.file_type || null,
      data.file_size || null,
      data.content || null,
      data.status || 'Active',
      userId,
      userId
    ];
    const res = await query(sql, params);
    return { id: res.insertId };
  }

  static async updateTemplate(id, data, userId) {
    const existing = await query('SELECT * FROM document_templates WHERE id = ?', [id]);
    if (!existing || existing.length === 0) throw new Error('Template not found');

    const sql = `
      UPDATE document_templates SET
        template_name = ?, category = ?, description = ?, template_source_type = ?,
        original_file_name = ?, file_path = ?, file_type = ?, file_size = ?,
        content = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      data.template_name ? data.template_name.trim() : existing[0].template_name,
      data.category || existing[0].category,
      data.description !== undefined ? data.description : existing[0].description,
      data.template_source_type || existing[0].template_source_type || 'editor',
      data.original_file_name !== undefined ? data.original_file_name : existing[0].original_file_name,
      data.file_path !== undefined ? data.file_path : existing[0].file_path,
      data.file_type !== undefined ? data.file_type : existing[0].file_type,
      data.file_size !== undefined ? data.file_size : existing[0].file_size,
      data.content !== undefined ? data.content : existing[0].content,
      data.status || existing[0].status,
      userId,
      id
    ];
    await query(sql, params);
    return true;
  }

  static async deleteTemplate(id) {
    await query('DELETE FROM document_templates WHERE id = ?', [id]);
    return true;
  }

  static async listTemplates(filters = {}) {
    let sql = 'SELECT * FROM document_templates WHERE 1=1';
    const params = [];
    if (filters.search) {
      sql += ' AND (template_name LIKE ? OR category LIKE ? OR description LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }
    if (filters.category && filters.category !== 'all') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }

  // ─── DIGITAL SIGNATURES ───
  static async createSignature(data, userId) {
    const sql = `
      INSERT INTO digital_signatures (doc_name, requested_by, requested_to, date, expiry_date, file, status, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.doc_name.trim(), data.requested_by || 'HR Manager', data.requested_to.trim(),
      data.date || new Date().toISOString().slice(0, 10), data.expiry_date || null,
      data.file || null, data.status || 'Pending', userId, userId
    ];
    const res = await query(sql, params);
    return { id: res.insertId };
  }

  static async updateSignature(id, data, userId) {
    const sql = `
      UPDATE digital_signatures SET
        doc_name = ?, requested_by = ?, requested_to = ?, date = ?, expiry_date = ?, file = ?, status = ?, updated_by = ?
      WHERE id = ?
    `;
    await query(sql, [
      data.doc_name.trim(), data.requested_by, data.requested_to.trim(),
      data.date, data.expiry_date || null, data.file || null, data.status, userId, id
    ]);
    return true;
  }

  static async deleteSignature(id) {
    await query('DELETE FROM digital_signatures WHERE id = ?', [id]);
    return true;
  }

  static async listSignatures(filters = {}) {
    let sql = 'SELECT * FROM digital_signatures WHERE 1=1';
    const params = [];
    if (filters.search) {
      sql += ' AND (doc_name LIKE ? OR requested_to LIKE ?)';
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

  // ─── META & DASHBOARD ───
  static async getMeta() {
    const employees = await query('SELECT id, name FROM employees WHERE status="Active" ORDER BY name');
    const departments = await query('SELECT id, dept_name as name FROM departments ORDER BY dept_name');
    const companies = await query('SELECT id, company_name as name FROM company_profile ORDER BY company_name');
    return { employees, departments, companies };
  }

  static async getDashboard() {
    const empDocsCount = (await query('SELECT COUNT(*) as c FROM employee_documents'))[0].c;
    const compDocsCount = (await query('SELECT COUNT(*) as c FROM company_documents'))[0].c;
    const policiesCount = (await query('SELECT COUNT(*) as c FROM hr_policies'))[0].c;
    const publishedPolicies = (await query("SELECT COUNT(*) as c FROM hr_policies WHERE status='Published'"))[0].c;
    const templatesCount = (await query('SELECT COUNT(*) as c FROM document_templates'))[0].c;
    const signaturesCount = (await query('SELECT COUNT(*) as c FROM digital_signatures'))[0].c;

    const signatureStats = await query(`
      SELECT status, COUNT(*) as c FROM digital_signatures GROUP BY status
    `);
    const totalSig = signatureStats.reduce((s, r) => s + r.c, 0);
    const colors = { 'Completed': '#10B981', 'Pending': '#F59E0B', 'Declined': '#EF4444', 'Expired': '#9CA3AF' };
    const sigPie = signatureStats.map(r => ({
      name: r.status,
      value: r.c,
      percent: totalSig > 0 ? `${((r.c / totalSig) * 100).toFixed(1)}%` : '0%',
      color: colors[r.status] || '#9CA3AF'
    }));

    return {
      kpis: { empDocsCount, compDocsCount, policiesCount, publishedPolicies, templatesCount, signaturesCount },
      sigPie
    };
  }

  static async deletePolicy(id) {
    await query('DELETE FROM hr_policies WHERE id = ?', [id]);
    return true;
  }

  static async listPolicies(filters = {}) {
    let sql = 'SELECT * FROM hr_policies WHERE 1=1';
    const params = [];
    if (filters.search) {
      sql += ' AND (policy_name LIKE ? OR category LIKE ?)';
      const term = `%${filters.search}%`;
      params.push(term, term);
    }
    if (filters.category && filters.category !== 'all') {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    sql += ' ORDER BY created_at DESC';
    return await query(sql, params);
  }
}

module.exports = DocumentService;
