const db = require("../config/database");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

exports.getStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Execute queries in parallel using Promise.all
    const [
      totalEmployeesRow,
      totalDepartmentsRow,
      totalBranchesRow,
      totalLeavesRow,
      attendanceTodayRow,
      totalProjectsRow,
      completedProjectsRow,
      totalClientsRow,
      totalRevenueRow,
      departmentSummary,
      recentActivity,
      upcomingHolidays,
      upcomingBirthdays,
      performanceEmployees,
      recentLeaves,
      teamPerformance
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'"),
      query("SELECT COUNT(*) as count FROM departments"),
      query("SELECT COUNT(*) as count FROM branches"),
      query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Approved' AND ? BETWEEN start_date AND end_date", [today]),
      query("SELECT COUNT(DISTINCT employee_id) as count FROM attendance WHERE DATE(punch_time) = ?", [today]),
      query("SELECT COUNT(*) as count FROM projects"),
      query("SELECT COUNT(*) as count FROM projects WHERE status = 'Completed'"),
      query("SELECT COUNT(DISTINCT client) as count FROM projects"),
      query("SELECT COALESCE(SUM(budget), 0) as count FROM projects"),
      query(`
        SELECT d.dept_name as dept, COUNT(e.id) as emp 
        FROM departments d 
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'Active'
        GROUP BY d.id, d.dept_name
      `),
      query(`
        SELECT a.punch_type, a.punch_time, e.id as employee_id, e.name as employee_name, e.profile_photo 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE e.status = 'Active'
        ORDER BY a.punch_time DESC LIMIT 5
      `),
      query("SELECT holiday_date as date, name FROM holidays WHERE holiday_date >= ? ORDER BY holiday_date ASC LIMIT 4", [today]),
      query(`
        SELECT e.id, e.name, e.profile_photo, DATE_FORMAT(e.dob, '%M %d') as date
        FROM employees e
        WHERE e.status = 'Active' AND e.dob IS NOT NULL
        ORDER BY DATE_FORMAT(e.dob, '%m%d') ASC
        LIMIT 4
      `),
      query(`
        SELECT 
          e.id,
          e.name, 
          e.profile_photo,
          COALESCE(d.dept_name, 'General') as dept, 
          COALESCE(desg.role_name, 'Employee') as designation, 
          IF(COUNT(g.id) > 0, ROUND(AVG(g.progress)/20, 2), 0.00) as score,
          CONCAT(IF(COUNT(g.id) > 0, ROUND(AVG(g.progress)), 0), '%') as goals,
          IF(COUNT(g.id) > 0, ROUND(AVG(g.progress)/20), 0) as stars,
          IF(COUNT(g.id) > 0, '↑ 5.0%', '0.0%') as trend, 
          IF(COUNT(g.id) > 0, 1, 0) as isUp 
        FROM employees e 
        LEFT JOIN departments d ON e.department_id = d.id 
        LEFT JOIN designations desg ON e.designation_id = desg.id 
        LEFT JOIN goals g ON e.id = g.employee_id
        WHERE e.status = 'Active'
        GROUP BY e.id, e.name, e.profile_photo, d.dept_name, desg.role_name
        LIMIT 5
      `),
      query(`
        SELECT e.id, e.name as employee_name, e.profile_photo, d.dept_name, lt.name as leave_name, DATEDIFF(la.end_date, la.start_date) + 1 as duration
        FROM leave_applications la
        JOIN employees e ON la.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.status = 'Approved' AND ? BETWEEN la.start_date AND la.end_date
      `, [today]),
      query(`
        SELECT 
          d.id,
          d.dept_name as team,
          d.dept_name as dept,
          (SELECT COUNT(*) FROM employees e WHERE e.department_id = d.id AND e.status = 'Active') as total_employees,
          (SELECT COUNT(*) FROM goals g WHERE (g.department_id = d.id OR g.employee_id IN (SELECT e2.id FROM employees e2 WHERE e2.department_id = d.id AND e2.status = 'Active')) AND g.status != 'Cancelled') as total_goals,
          COALESCE(
            (SELECT ROUND(AVG(COALESCE(g.completion_percentage, g.progress, 0))) 
             FROM goals g 
             WHERE (g.department_id = d.id OR g.employee_id IN (SELECT e2.id FROM employees e2 WHERE e2.department_id = d.id AND e2.status = 'Active')) 
               AND g.status != 'Cancelled'),
            0
          ) as achievement
        FROM departments d
        ORDER BY d.id ASC
      `)
    ]);

    return res.status(200).json({
      totalEmployees: totalEmployeesRow[0]?.count || 0,
      totalDepartments: totalDepartmentsRow[0]?.count || 0,
      totalBranches: totalBranchesRow[0]?.count || 0,
      totalLeaves: totalLeavesRow[0]?.count || 0,
      attendanceToday: attendanceTodayRow[0]?.count || 0,
      totalProjects: totalProjectsRow[0]?.count || 0,
      completedProjects: completedProjectsRow[0]?.count || 0,
      totalClients: totalClientsRow[0]?.count || 0,
      totalRevenue: totalRevenueRow[0]?.count || 0,
      departmentSummary,
      teamPerformance,
      recentActivity,
      upcomingHolidays,
      upcomingBirthdays,
      performanceEmployees,
      recentLeaves
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ success: false, message: "Internal server error fetching dashboard statistics" });
  }
};
