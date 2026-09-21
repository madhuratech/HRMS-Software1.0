const db = require('../config/database');

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

class PunchLocationService {
  static async createLocation(data) {
    const { name, branch, latitude, longitude, radius, address, description, status } = data;
    const sql = `
      INSERT INTO GeofenceLocations (name, branch, latitude, longitude, radius, address, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(sql, [name, branch, latitude, longitude, radius, address, description, status || 'Active']);
    return { id: result.insertId, ...data };
  }

  static async updateLocation(id, data) {
    const { name, branch, latitude, longitude, radius, address, description, status } = data;
    const sql = `
      UPDATE GeofenceLocations
      SET name = ?, branch = ?, latitude = ?, longitude = ?, radius = ?, address = ?, description = ?, status = ?
      WHERE id = ?
    `;
    await query(sql, [name, branch, latitude, longitude, radius, address, description, status, id]);
    return { id, ...data };
  }

  static async deleteLocation(id) {
    const sql = `DELETE FROM GeofenceLocations WHERE id = ?`;
    await query(sql, [id]);
    return { success: true };
  }

  static async getLocationById(id) {
    const sql = `SELECT * FROM GeofenceLocations WHERE id = ?`;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }

  static async toggleStatus(id, status) {
    const sql = `UPDATE GeofenceLocations SET status = ? WHERE id = ?`;
    await query(sql, [status, id]);
    return { id, status };
  }

  static async getLocations(params = {}) {
    const { search = '', status = '', page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR branch LIKE ? OR address LIKE ?)';
      const searchWildcard = `%${search}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard);
    }

    if (status) {
      whereClause += ' AND status = ?';
      queryParams.push(status);
    }

    const countSql = `SELECT COUNT(*) as total FROM GeofenceLocations ${whereClause}`;
    const countResult = await query(countSql, queryParams);
    const total = countResult[0].total;

    const listSql = `
      SELECT * FROM GeofenceLocations
      ${whereClause}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    // MySQL expects LIMIT/OFFSET to be numeric, so push them
    const listResult = await query(listSql, [...queryParams, parseInt(limit), parseInt(offset)]);

    return {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      locations: listResult
    };
  }

  static async getActiveLocations() {
    const sql = `SELECT * FROM GeofenceLocations WHERE status = 'Active'`;
    return await query(sql);
  }
}

module.exports = PunchLocationService;
