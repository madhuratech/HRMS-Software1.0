const Orientation = require('../models/Orientation');

class OrientationService {
  // Fetch eligible joiners (whose document verification is Completed or Verified)
  static async getEligibleJoiners() {
    const sql = `
      SELECT nj.*, d.dept_name as department_name, dv.id as verification_id
      FROM new_joiners nj
      JOIN document_verifications dv ON nj.id = dv.new_joiner_id
      LEFT JOIN departments d ON nj.department_id = d.id
      WHERE dv.status IN ('Verified', 'Completed')
      ORDER BY nj.employee_name ASC
    `;
    return await Orientation.query(sql);
  }

  // Schedule Orientation Session
  static async create(data, userId) {
    // Prevent duplicate orientation sessions for the same employee on the same date and time
    const checkSql = `
      SELECT id FROM orientations 
      WHERE new_joiner_id = ? AND orientation_date = ? AND start_time = ?
    `;
    const check = await Orientation.query(checkSql, [data.new_joiner_id, data.orientation_date, data.start_time]);
    if (check.length > 0) {
      throw new Error('This employee already has an orientation scheduled at this date and time.');
    }

    const sql = `
      INSERT INTO orientations (
        new_joiner_id, title, orientation_date, start_time, end_time,
        trainer, venue, session_type, meeting_link, status, notes, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      data.new_joiner_id, data.title, data.orientation_date, data.start_time, data.end_time,
      data.trainer, data.venue, data.session_type, data.meeting_link || null, data.status || 'Scheduled',
      data.notes || null, userId, userId
    ];

    await Orientation.beginTransaction();
    try {
      const result = await Orientation.query(sql, params);
      await Orientation.commit();
      return { id: result.insertId };
    } catch (error) {
      await Orientation.rollback();
      throw error;
    }
  }

  // Update
  static async update(id, data, userId) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Orientation record not found');

    const sql = `
      UPDATE orientations SET
        title = ?, orientation_date = ?, start_time = ?, end_time = ?,
        trainer = ?, venue = ?, session_type = ?, meeting_link = ?, status = ?, notes = ?, updated_by = ?
      WHERE id = ?
    `;

    const params = [
      data.title, data.orientation_date, data.start_time, data.end_time,
      data.trainer, data.venue, data.session_type, data.meeting_link || null, data.status,
      data.notes || null, userId, id
    ];

    await Orientation.beginTransaction();
    try {
      await Orientation.query(sql, params);
      await Orientation.commit();
      return true;
    } catch (error) {
      await Orientation.rollback();
      throw error;
    }
  }

  // Delete
  static async delete(id) {
    await Orientation.beginTransaction();
    try {
      await Orientation.query('DELETE FROM orientations WHERE id = ?', [id]);
      await Orientation.commit();
      return true;
    } catch (error) {
      await Orientation.rollback();
      throw error;
    }
  }

  // Complete
  static async complete(id, userId) {
    await Orientation.beginTransaction();
    try {
      await Orientation.query(
        "UPDATE orientations SET status = 'Completed', updated_by = ? WHERE id = ?",
        [userId, id]
      );
      await Orientation.commit();
      return true;
    } catch (error) {
      await Orientation.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await Orientation.query(
      `SELECT o.*, 
              nj.employee_name, nj.designation, nj.joining_date, nj.reporting_manager,
              d.dept_name as department_name
       FROM orientations o
       LEFT JOIN new_joiners nj ON o.new_joiner_id = nj.id
       LEFT JOIN departments d ON nj.department_id = d.id
       WHERE o.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT o.*, 
             nj.employee_name, nj.designation, nj.joining_date, nj.reporting_manager,
             d.dept_name as department_name
      FROM orientations o
      LEFT JOIN new_joiners nj ON o.new_joiner_id = nj.id
      LEFT JOIN departments d ON nj.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (nj.employee_name LIKE ? OR o.title LIKE ? OR o.trainer LIKE ? OR o.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY o.orientation_date DESC, o.start_time DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await Orientation.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as count
      FROM orientations o
      LEFT JOIN new_joiners nj ON o.new_joiner_id = nj.id
      LEFT JOIN departments d ON nj.department_id = d.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (nj.employee_name LIKE ? OR o.title LIKE ? OR o.trainer LIKE ? OR o.status LIKE ?)`;
      countParams.push(term, term, term, term);
    }

    const totalResult = await Orientation.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getDashboardStats() {
    const upcoming = await Orientation.query(`SELECT COUNT(*) as count FROM orientations WHERE status = 'Scheduled' AND orientation_date >= CURDATE()`);
    const completed = await Orientation.query(`SELECT COUNT(*) as count FROM orientations WHERE status = 'Completed'`);
    const attendees = await Orientation.query(`SELECT COUNT(DISTINCT new_joiner_id) as count FROM orientations`);
    const today = await Orientation.query(`SELECT COUNT(*) as count FROM orientations WHERE orientation_date = CURDATE()`);

    return {
      upcoming: upcoming[0].count || 0,
      completed: completed[0].count || 0,
      totalAttendees: attendees[0].count || 0,
      todaySessions: today[0].count || 0
    };
  }
}

module.exports = OrientationService;
