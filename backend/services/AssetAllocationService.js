const AssetAllocation = require('../models/AssetAllocation');

class AssetAllocationService {
  // Available assets for dropdown
  static async getAvailableAssets() {
    return await AssetAllocation.query("SELECT * FROM assets WHERE status = 'Available' ORDER BY asset_name ASC");
  }

  // Allocate Asset
  static async allocate(data, userId) {
    // Check if asset is already allocated
    const asset = await AssetAllocation.query('SELECT status FROM assets WHERE id = ?', [data.asset_id]);
    if (!asset[0]) throw new Error('Asset not found');
    if (asset[0].status === 'Allocated') {
      throw new Error('This asset is already allocated to another employee');
    }

    await AssetAllocation.beginTransaction();
    try {
      // 1. Insert allocation record
      const sql = `
        INSERT INTO asset_allocations (
          employee_id, asset_id, allocation_date, assigned_by, status, description, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.employee_id, data.asset_id, data.allocation_date, data.assigned_by, data.status || 'Allocated',
        data.description || null, userId, userId
      ];
      const result = await AssetAllocation.query(sql, params);

      // 2. Update asset status to 'Allocated'
      await AssetAllocation.query("UPDATE assets SET status = 'Allocated' WHERE id = ?", [data.asset_id]);

      await AssetAllocation.commit();
      return { id: result.insertId };
    } catch (error) {
      await AssetAllocation.rollback();
      throw error;
    }
  }

  // Return Asset
  static async returnAsset(id, userId) {
    const allocation = await this.getById(id);
    if (!allocation) throw new Error('Allocation record not found');
    if (allocation.status === 'Returned') throw new Error('Asset already returned');

    await AssetAllocation.beginTransaction();
    try {
      // 1. Update allocation status
      await AssetAllocation.query(
        "UPDATE asset_allocations SET status = 'Returned', updated_by = ? WHERE id = ?",
        [userId, id]
      );

      // 2. Update asset status back to 'Available'
      await AssetAllocation.query("UPDATE assets SET status = 'Available' WHERE id = ?", [allocation.asset_id]);

      await AssetAllocation.commit();
      return true;
    } catch (error) {
      await AssetAllocation.rollback();
      throw error;
    }
  }

  // Delete Allocation
  static async delete(id) {
    const allocation = await this.getById(id);
    if (!allocation) throw new Error('Allocation record not found');

    await AssetAllocation.beginTransaction();
    try {
      await AssetAllocation.query('DELETE FROM asset_allocations WHERE id = ?', [id]);
      if (allocation.status === 'Allocated') {
        await AssetAllocation.query("UPDATE assets SET status = 'Available' WHERE id = ?", [allocation.asset_id]);
      }
      await AssetAllocation.commit();
      return true;
    } catch (error) {
      await AssetAllocation.rollback();
      throw error;
    }
  }

  static async getById(id) {
    const rows = await AssetAllocation.query(
      `SELECT aa.*, 
              e.name as employee_name, e.email as employee_email, e.phone as employee_phone,
              d.dept_name as department_name,
              a.asset_name, a.asset_type, a.serial_number
       FROM asset_allocations aa
       LEFT JOIN employees e ON aa.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN assets a ON aa.asset_id = a.id
       WHERE aa.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async list(filters, pagination) {
    let sql = `
      SELECT aa.*, 
             e.name as employee_name, e.email as employee_email, e.phone as employee_phone,
             d.dept_name as department_name,
             a.asset_name, a.asset_type, a.serial_number
      FROM asset_allocations aa
      LEFT JOIN employees e ON aa.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN assets a ON aa.asset_id = a.id
      WHERE 1=1
    `;
    const params = [];

    // Search
    if (filters.search) {
      sql += ` AND (e.name LIKE ? OR a.asset_name LIKE ? OR a.serial_number LIKE ? OR aa.status LIKE ?)`;
      const term = `%${filters.search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY aa.created_at DESC`;

    if (pagination) {
      sql += ` LIMIT ? OFFSET ?`;
      params.push(pagination.limit, pagination.offset);
    }

    const rows = await AssetAllocation.query(sql, params);

    // Count
    let countSql = `
      SELECT COUNT(*) as count
      FROM asset_allocations aa
      LEFT JOIN employees e ON aa.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN assets a ON aa.asset_id = a.id
      WHERE 1=1
    `;
    const countParams = [];
    if (filters.search) {
      countSql += ` AND (e.name LIKE ? OR a.asset_name LIKE ? OR a.serial_number LIKE ? OR aa.status LIKE ?)`;
      countParams.push(term, term, term, term);
    }

    const totalResult = await AssetAllocation.query(countSql, countParams);
    return {
      rows,
      total: totalResult[0].count
    };
  }

  static async getDashboardStats() {
    // KPI metrics
    const totalAssets = await AssetAllocation.query(`SELECT COUNT(*) as count FROM assets`);
    const allocatedAssets = await AssetAllocation.query(`SELECT COUNT(*) as count FROM assets WHERE status = 'Allocated'`);
    const pendingAllocations = await AssetAllocation.query(`SELECT COUNT(*) as count FROM asset_allocations WHERE status = 'Pending'`);
    const availableAssets = await AssetAllocation.query(`SELECT COUNT(*) as count FROM assets WHERE status = 'Available'`);

    // Type breakdown (Laptop, Monitor, Mobile, Peripheral, Tablet)
    const typeBreakdown = await AssetAllocation.query(`
      SELECT asset_type as name, COUNT(*) as count FROM assets GROUP BY asset_type
    `);

    // Donut chart status
    const returnedCount = await AssetAllocation.query(`SELECT COUNT(*) as count FROM asset_allocations WHERE status = 'Returned'`);

    const total = totalAssets[0].count || 0;
    const allocated = allocatedAssets[0].count || 0;
    const available = availableAssets[0].count || 0;

    return {
      total,
      allocated,
      pending: pendingAllocations[0].count || 0,
      available,
      summaryData: typeBreakdown,
      chartData: [
        { name: 'Allocated', value: allocated, color: '#2952E3' },
        { name: 'Pending', value: pendingAllocations[0].count || 0, color: '#F59E0B' },
        { name: 'Returned', value: returnedCount[0].count || 0, color: '#64748B' }
      ]
    };
  }
}

module.exports = AssetAllocationService;
