const Client = require('../models/Client');

class ClientService {
  /**
   * Auto-generate unique client code: CLI-0001
   */
  static async generateCode() {
    const rows = await Client.query(`SELECT client_code FROM clients ORDER BY id DESC LIMIT 1`);
    if (rows && rows.length > 0) {
      const last = rows[0].client_code || 'CLI-0000';
      const num = parseInt(last.replace('CLI-', ''), 10) || 0;
      return `CLI-${String(num + 1).padStart(4, '0')}`;
    }
    return 'CLI-0001';
  }

  /**
   * Create a new client
   */
  static async create(data, userId) {
    const code = await this.generateCode();

    // Duplicate check by email or company_name
    if (data.email) {
      const dup = await Client.query(
        `SELECT id FROM clients WHERE email = ? LIMIT 1`,
        [data.email.trim()]
      );
      if (dup && dup.length > 0) {
        throw new Error(`A client with email "${data.email}" already exists.`);
      }
    }

    const sql = `
      INSERT INTO clients (
        client_code, company_name, project, contact_person, designation, email, phone, alternate_phone,
        website, industry, company_size, address, city, state, country, postal_code,
        client_type, status, gst_number, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      code,
      (data.company_name || '').trim(),
      data.project ? data.project.trim() : null,
      data.contact_person || null,
      data.designation || null,
      data.email ? data.email.trim() : null,
      data.phone || null,
      data.alternate_phone || null,
      data.website || null,
      data.industry || null,
      data.company_size || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.country || null,
      data.postal_code || null,
      data.client_type || 'Prospect',
      data.status || 'Active',
      data.gst_number || null,
      data.notes || null,
      userId,
      userId
    ];

    const result = await Client.query(sql, params);
    const clientId = result.insertId;

    // If a project is specified, link or create project in projects table
    if (data.project && data.project.trim()) {
      try {
        const projName = data.project.trim();
        const existingProj = await Client.query(`SELECT id FROM projects WHERE project_name = ? LIMIT 1`, [projName]);
        if (existingProj && existingProj.length > 0) {
          await Client.query(
            `UPDATE projects SET client_id = ?, client = ? WHERE id = ?`,
            [clientId, (data.company_name || '').trim(), existingProj[0].id]
          );
        } else {
          const lastPrj = await Client.query(`SELECT project_code FROM projects ORDER BY id DESC LIMIT 1`);
          let nextCode = 'PRJ-0001';
          if (lastPrj && lastPrj.length > 0 && lastPrj[0].project_code) {
            const num = parseInt(lastPrj[0].project_code.replace(/[^0-9]/g, ''), 10) || 0;
            nextCode = `PRJ-${String(num + 1).padStart(4, '0')}`;
          }
          await Client.query(
            `INSERT INTO projects (project_name, project_code, client, client_id, status, priority, created_by, updated_by)
             VALUES (?, ?, ?, ?, 'In Progress', 'Medium', ?, ?)`,
            [projName, nextCode, (data.company_name || '').trim(), clientId, userId, userId]
          );
        }
      } catch (pe) {
        console.warn('[ClientService] Could not auto-sync project:', pe.message);
      }
    }

    return { id: clientId, client_code: code };
  }

  /**
   * Update an existing client
   */
  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Client not found');

    // Duplicate email check (excluding self)
    if (data.email) {
      const dup = await Client.query(
        `SELECT id FROM clients WHERE email = ? AND id != ? LIMIT 1`,
        [data.email.trim(), id]
      );
      if (dup && dup.length > 0) {
        throw new Error(`A client with email "${data.email}" already exists.`);
      }
    }

    const sql = `
      UPDATE clients SET
        company_name = ?, project = ?, contact_person = ?, designation = ?, email = ?, phone = ?,
        alternate_phone = ?, website = ?, industry = ?, company_size = ?,
        address = ?, city = ?, state = ?, country = ?, postal_code = ?,
        client_type = ?, status = ?, gst_number = ?, notes = ?, updated_by = ?
      WHERE id = ?
    `;
    const params = [
      (data.company_name || '').trim(),
      data.project !== undefined ? (data.project ? data.project.trim() : null) : existing.project,
      data.contact_person || null,
      data.designation || null,
      data.email ? data.email.trim() : null,
      data.phone || null,
      data.alternate_phone || null,
      data.website || null,
      data.industry || null,
      data.company_size || null,
      data.address || null,
      data.city || null,
      data.state || null,
      data.country || null,
      data.postal_code || null,
      data.client_type || existing.client_type,
      data.status || existing.status,
      data.gst_number || null,
      data.notes || null,
      userId,
      id
    ];

    await Client.query(sql, params);

    // Sync project linkage if project provided
    if (data.project && data.project.trim()) {
      try {
        const projName = data.project.trim();
        const existingProj = await Client.query(`SELECT id FROM projects WHERE project_name = ? LIMIT 1`, [projName]);
        if (existingProj && existingProj.length > 0) {
          await Client.query(
            `UPDATE projects SET client_id = ?, client = ? WHERE id = ?`,
            [id, (data.company_name || existing.company_name || '').trim(), existingProj[0].id]
          );
        } else {
          const lastPrj = await Client.query(`SELECT project_code FROM projects ORDER BY id DESC LIMIT 1`);
          let nextCode = 'PRJ-0001';
          if (lastPrj && lastPrj.length > 0 && lastPrj[0].project_code) {
            const num = parseInt(lastPrj[0].project_code.replace(/[^0-9]/g, ''), 10) || 0;
            nextCode = `PRJ-${String(num + 1).padStart(4, '0')}`;
          }
          await Client.query(
            `INSERT INTO projects (project_name, project_code, client, client_id, status, priority, created_by, updated_by)
             VALUES (?, ?, ?, ?, 'In Progress', 'Medium', ?, ?)`,
            [projName, nextCode, (data.company_name || existing.company_name || '').trim(), id, userId, userId]
          );
        }
      } catch (pe) {
        console.warn('[ClientService] Could not auto-sync project on update:', pe.message);
      }
    }

    return true;
  }

  /**
   * Soft delete (mark Inactive + Blocked) — or hard delete based on the project choice.
   * Using hard delete here consistent with how projects are deleted.
   */
  static async delete(id) {
    // Nullify client_id in projects linked to this client
    await Client.query(`UPDATE projects SET client_id = NULL WHERE client_id = ?`, [id]);
    const result = await Client.query(`DELETE FROM clients WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get a single client by ID
   */
  static async getById(id) {
    const rows = await Client.query(
      `SELECT c.*,
              cb.name as created_by_name,
              ub.name as updated_by_name
       FROM clients c
       LEFT JOIN employees cb ON c.created_by = cb.id
       LEFT JOIN employees ub ON c.updated_by = ub.id
       WHERE c.id = ?`,
      [id]
    );
    if (!rows[0]) return null;
    const client = rows[0];
    if (!client.project) {
      try {
        const projs = await Client.query(`SELECT project_name FROM projects WHERE client_id = ? ORDER BY id DESC LIMIT 1`, [id]);
        if (projs && projs.length > 0) {
          client.project = projs[0].project_name;
        }
      } catch (e) {}
    }
    return client;
  }

  /**
   * List clients with filters + pagination
   */
  static async list(filters, pagination) {
    let sql = `
      SELECT c.*,
             cb.name as created_by_name,
             (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) as project_count
      FROM clients c
      LEFT JOIN employees cb ON c.created_by = cb.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (c.company_name LIKE ? OR c.client_code LIKE ? OR c.project LIKE ? OR c.contact_person LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      const t = `%${filters.search}%`;
      params.push(t, t, t, t, t, t);
    }

    if (filters.client_type) {
      sql += ` AND c.client_type = ?`;
      params.push(filters.client_type);
    }

    if (filters.status) {
      sql += ` AND c.status = ?`;
      params.push(filters.status);
    }

    if (filters.industry) {
      sql += ` AND c.industry = ?`;
      params.push(filters.industry);
    }

    sql += ` ORDER BY c.created_at DESC`;

    // Count
    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const totalResult = await Client.query(countSql, params);

    sql += ` LIMIT ? OFFSET ?`;
    const rows = await Client.query(sql, [...params, pagination.limit, pagination.offset]);

    return {
      rows,
      total: totalResult[0].count
    };
  }

  /**
   * Get summary stats for the top cards
   */
  static async getStats() {
    const rows = await Client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN client_type = 'Prospect' THEN 1 ELSE 0 END) as prospect,
        SUM(CASE WHEN status = 'Inactive' OR status = 'Blocked' THEN 1 ELSE 0 END) as inactive
      FROM clients
    `);
    return rows[0] || { total: 0, active: 0, prospect: 0, inactive: 0 };
  }

  /**
   * Get distinct industries for filter dropdown
   */
  static async getIndustries() {
    const rows = await Client.query(
      `SELECT DISTINCT industry FROM clients WHERE industry IS NOT NULL AND industry != '' ORDER BY industry`
    );
    return rows.map(r => r.industry);
  }

  /**
   * Get all active clients for project dropdown (lightweight)
   */
  static async getActiveList() {
    const rows = await Client.query(
      `SELECT id, client_code, company_name, contact_person, industry, status
       FROM clients WHERE status = 'Active' ORDER BY company_name`
    );
    return rows;
  }

  /**
   * Get all projects linked to a client
   */
  static async getProjects(clientId) {
    const rows = await Client.query(
      `SELECT p.id, p.project_name, p.project_code, p.status, p.priority,
              p.start_date, p.end_date,
              e.name as project_manager_name,
              (SELECT COUNT(*) FROM project_team_members ptm WHERE ptm.project_id = p.id) as team_count
       FROM projects p
       LEFT JOIN employees e ON p.project_manager_id = e.id
       WHERE p.client_id = ?
       ORDER BY p.created_at DESC`,
      [clientId]
    );
    return rows;
  }

  /**
   * Get activity log for a client (created + updated events)
   */
  static async getActivity(clientId) {
    const rows = await Client.query(
      `SELECT 'Client Created' as event_type, c.created_at as event_time, cb.name as actor_name
       FROM clients c
       LEFT JOIN employees cb ON c.created_by = cb.id
       WHERE c.id = ?
       UNION ALL
       SELECT 'Client Updated' as event_type, c.updated_at as event_time, ub.name as actor_name
       FROM clients c
       LEFT JOIN employees ub ON c.updated_by = ub.id
       WHERE c.id = ? AND c.updated_at != c.created_at
       ORDER BY event_time DESC`,
      [clientId, clientId]
    );
    return rows;
  }
}

module.exports = ClientService;
