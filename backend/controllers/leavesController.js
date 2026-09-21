const db = require("../config/database");

exports.getTypes = (req, res) => {
  db.query("SELECT * FROM leave_types ORDER BY id ASC", (err, rows) => {
    if (err) {
      console.error("Error fetching leave types:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch leave types", error: err.message });
    }
    res.json(rows);
  });
};

exports.createType = (req, res) => {
  const { name, code, desc, description, maxDays, max_days, carryForward, forward, requiresApproval, requires_approval, paidLeave, is_paid, status } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Leave type name is required." });
  }
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, message: "Leave code is required." });
  }

  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  const days = parseInt(maxDays || max_days, 10) || 12;
  const isFwd = (carryForward === true || carryForward === 'Yes' || forward === 'Yes') ? 'Yes' : 'No';
  const cleanDesc = desc || description || '';
  const cleanStatus = status || 'Active';
  const cleanPaid = (paidLeave !== undefined) ? (paidLeave ? 1 : 0) : ((is_paid !== undefined) ? (is_paid ? 1 : 0) : 1);
  const cleanApproval = (requiresApproval !== undefined) ? (requiresApproval ? 1 : 0) : ((requires_approval !== undefined) ? (requires_approval ? 1 : 0) : 1);

  const sql = `
    INSERT INTO leave_types (name, code, max_days, forward, type_name, days_allowed, is_paid, description, status, requires_approval)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [cleanName, cleanCode, days, isFwd, cleanName, days, cleanPaid, cleanDesc, cleanStatus, cleanApproval], (err, result) => {
    if (err) {
      console.error("Error creating leave type:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: `A leave type with this name or code '${cleanCode}' already exists.` });
      }
      return res.status(500).json({ success: false, message: err.message || "Failed to create leave type" });
    }
    const newId = result.insertId;
    if (cleanStatus === 'Active') {
      db.query("SELECT id FROM employees WHERE status = 'Active'", (empErr, emps) => {
        if (!empErr && Array.isArray(emps)) {
          for (const emp of emps) {
            db.query(
              "INSERT IGNORE INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining) VALUES (?, ?, 0, ?)",
              [emp.id, newId, days],
              () => {}
            );
          }
        }
      });
    }
    res.json({ success: true, message: "Leave type created successfully", id: newId });
  });
};

exports.updateType = (req, res) => {
  const { id } = req.params;
  const { name, code, desc, description, maxDays, max_days, carryForward, forward, requiresApproval, requires_approval, paidLeave, is_paid, status } = req.body;

  const cleanName = name ? name.trim() : '';
  const cleanCode = code ? code.trim().toUpperCase() : '';
  const days = parseInt(maxDays || max_days, 10) || 12;
  const isFwd = (carryForward === true || carryForward === 'Yes' || forward === 'Yes') ? 'Yes' : 'No';
  const cleanDesc = desc || description || '';
  const cleanStatus = status || 'Active';
  const cleanPaid = (paidLeave !== undefined) ? (paidLeave ? 1 : 0) : ((is_paid !== undefined) ? (is_paid ? 1 : 0) : 1);
  const cleanApproval = (requiresApproval !== undefined) ? (requiresApproval ? 1 : 0) : ((requires_approval !== undefined) ? (requires_approval ? 1 : 0) : 1);

  const sql = `
    UPDATE leave_types
    SET name = ?, code = ?, max_days = ?, forward = ?, type_name = ?, days_allowed = ?, is_paid = ?, description = ?, status = ?, requires_approval = ?
    WHERE id = ?
  `;
  db.query(sql, [cleanName, cleanCode, days, isFwd, cleanName, days, cleanPaid, cleanDesc, cleanStatus, cleanApproval, id], (err, result) => {
    if (err) {
      console.error("Error updating leave type:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: `A leave type with this name or code '${cleanCode}' already exists.` });
      }
      return res.status(500).json({ success: false, message: err.message || "Failed to update leave type" });
    }
    res.json({ success: true, message: "Leave type updated successfully" });
  });
};

exports.deleteType = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM leave_types WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Error deleting leave type:", err);
      return res.status(500).json({ success: false, message: err.message || "Failed to delete leave type" });
    }
    res.json({ success: true, message: "Leave type deleted successfully" });
  });
};

exports.getBalances = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']);
    const identity = await IdentityService.resolveUser(authIdentifier);

    let targetEmpId = parseInt(req.params.employee_id, 10);
    if (isNaN(targetEmpId) || req.params.employee_id === 'me') {
      targetEmpId = identity?.employeeId;
    }

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const isEmp = !['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'TEAMLEADER', 'TEAMLEAD'].includes(userRole);

    // Security: Employee can only view their own balance
    if (isEmp && targetEmpId !== identity?.employeeId) {
      return res.status(403).json({ success: false, message: "Forbidden: You are only authorized to view your own leave balance." });
    }

    // Team Leader can only view self or team members
    if (['TEAMLEADER', 'TEAMLEAD'].includes(userRole) && targetEmpId !== identity?.employeeId) {
      const isTeamMember = await new Promise(r => db.query(
        "SELECT id FROM employees WHERE id = ? AND team_id = ? LIMIT 1",
        [targetEmpId, identity?.teamId || 0],
        (err, rows) => r(rows && rows.length > 0)
      ));
      if (!isTeamMember) {
        return res.status(403).json({ success: false, message: "Forbidden: You are only authorized to view your team members' leave balances." });
      }
    }

    // Ensure all active leave types are initialized in leave_balances for target employee
    const activeTypes = await new Promise(r => db.query(
      "SELECT id, max_days FROM leave_types WHERE status = 'Active' OR status IS NULL",
      (err, rows) => r(rows || [])
    ));
    for (const lt of (activeTypes || [])) {
      await new Promise(r => db.query(
        "INSERT IGNORE INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining) VALUES (?, ?, 0, ?)",
        [targetEmpId, lt.id, lt.max_days || 12],
        () => r()
      ));
    }

    const sql = `
      SELECT lb.*, lt.name as leave_name, lt.code as leave_code, lt.max_days, lt.forward
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = ?
      ORDER BY lt.id ASC
    `;
    db.query(sql, [targetEmpId], (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  } catch (err) {
    console.error("Error in getBalances:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllBalances = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']) || 1;
    const identity = await IdentityService.resolveUser(authIdentifier);

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const currentEmpId = identity?.employeeId || req.user?.employeeId || req.user?.employee_id;
    const currentTeamId = identity?.teamId;

    // 1. Ensure all active employees have leave_balances initialized for all active leave types
    const activeLeaveTypes = await new Promise((resolve) => {
      db.query("SELECT * FROM leave_types WHERE status = 'Active' OR status IS NULL ORDER BY id ASC", (err, rows) => {
        resolve(rows || []);
      });
    });

    const activeEmployees = await new Promise((resolve) => {
      db.query("SELECT id FROM employees WHERE status = 'Active'", (err, rows) => {
        resolve(rows || []);
      });
    });

    for (const emp of activeEmployees) {
      for (const lt of activeLeaveTypes) {
        await new Promise((resolve) => {
          db.query(
            "INSERT IGNORE INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining) VALUES (?, ?, 0, ?)",
            [emp.id, lt.id, lt.max_days !== undefined ? lt.max_days : (lt.days_allowed || 12)],
            () => resolve()
          );
        });
      }
    }

    let whereClause = "WHERE e.status = 'Active'";
    const params = [];

    // Role-based scoping:
    // 1. SUPER_ADMIN / ADMIN / HR_MANAGER: View all employees
    // 2. TEAM_LEADER: View only members of their team (e.team_id = currentTeamId OR e.id = currentEmpId OR e.team_id IN (SELECT id FROM teams WHERE team_lead_id = ?))
    // 3. EMPLOYEE: View only their own balance
    if (['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'BRANCHMANAGER'].includes(userRole)) {
      // Full view - no extra filtering
    } else if (['TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(userRole)) {
      whereClause += ` AND (
        (e.team_id IS NOT NULL AND e.team_id = ?) 
        OR e.id = ? 
        OR e.team_id IN (SELECT id FROM teams WHERE team_lead_id = ?)
      )`;
      params.push(currentTeamId || 0, currentEmpId || 0, currentEmpId || 0);
    } else {
      // Standard employee
      whereClause += ` AND e.id = ?`;
      params.push(currentEmpId || 0);
    }

    const sql = `
      SELECT 
        e.id as employee_id,
        e.name as employee_name,
        e.profile_photo,
        COALESCE(d.dept_name, 'General') as dept,
        lb.leave_type_id,
        lt.code as leave_code,
        lt.name as leave_name,
        COALESCE(lb.days_remaining, lt.max_days, 0) as days_remaining
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN leave_balances lb ON lb.employee_id = e.id
      LEFT JOIN leave_types lt ON lb.leave_type_id = lt.id AND (lt.status = 'Active' OR lt.status IS NULL)
      ${whereClause}
      ORDER BY (e.id = ?) DESC, e.name ASC
    `;
    params.push(currentEmpId || 0);

    db.query(sql, params, (err, rows) => {
      if (err) {
        console.error("Error fetching leave balances:", err);
        return res.status(500).json({ success: false, message: "Error fetching leave balances", error: err.message });
      }

      const empMap = new Map();
      const typeTotals = {};
      activeLeaveTypes.forEach(t => {
        typeTotals[t.code] = 0;
      });

      (rows || []).forEach(r => {
        if (!empMap.has(r.employee_id)) {
          empMap.set(r.employee_id, {
            id: r.employee_id,
            name: r.employee_name,
            profile_photo: r.profile_photo,
            dept: r.dept,
            balances: {},
            total: 0
          });
        }
        const empObj = empMap.get(r.employee_id);
        if (r.leave_code) {
          const remaining = parseFloat(r.days_remaining) || 0;
          empObj.balances[r.leave_code] = remaining;
          empObj.total += remaining;
          typeTotals[r.leave_code] = (typeTotals[r.leave_code] || 0) + remaining;
        }
      });

      const formatted = Array.from(empMap.values()).map(e => ({
        ...e,
        cl: e.balances['CL'] || 0,
        sl: e.balances['SL'] || 0,
        el: e.balances['EL'] || 0,
        comp: e.balances['COMP'] || 0
      }));

      return res.json({
        success: true,
        leaveTypes: activeLeaveTypes.map(t => ({
          id: t.id,
          name: t.name,
          code: t.code,
          maxDays: t.max_days !== undefined ? t.max_days : (t.days_allowed || 12)
        })),
        summary: {
          cl: `${typeTotals['CL'] || 0} Days`,
          sl: `${typeTotals['SL'] || 0} Days`,
          el: `${typeTotals['EL'] || 0} Days`,
          comp: `${typeTotals['COMP'] || 0} Hours`,
          byType: activeLeaveTypes.map(t => ({
            code: t.code,
            name: t.name,
            total: `${typeTotals[t.code] || 0} Days`
          }))
        },
        records: formatted
      });
    });
  } catch (e) {
    console.error("Exception in getAllBalances:", e);
    return res.status(500).json({ success: false, message: e.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']) || 1;
    const identity = await IdentityService.resolveUser(authIdentifier);

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const currentEmpId = identity?.employeeId || req.user?.employeeId || req.user?.employee_id;
    const currentTeamId = identity?.teamId;

    const { employee_id } = req.query;
    let sql = `
      SELECT la.*, e.name as employee_name, lt.name as leave_name, lt.code as leave_code
      FROM leave_applications la
      JOIN employees e ON la.employee_id = e.id
      JOIN leave_types lt ON la.leave_type_id = lt.id
    `;
    const whereParts = [];
    const params = [];

    if (employee_id) {
      whereParts.push("la.employee_id = ?");
      params.push(employee_id);
    } else if (['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'BRANCHMANAGER'].includes(userRole)) {
      // Full view
    } else if (['TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(userRole)) {
      whereParts.push(`(
        (e.team_id IS NOT NULL AND e.team_id = ?) 
        OR e.id = ? 
        OR e.team_id IN (SELECT id FROM teams WHERE team_lead_id = ?)
      )`);
      params.push(currentTeamId || 0, currentEmpId || 0, currentEmpId || 0);
    } else {
      whereParts.push("la.employee_id = ?");
      params.push(currentEmpId || 0);
    }

    if (whereParts.length > 0) {
      sql += " WHERE " + whereParts.join(" AND ");
    }
    sql += " ORDER BY la.applied_on DESC";

    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  } catch (err) {
    console.error("Error in getApplications:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitApplication = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']);
    const identity = await IdentityService.resolveUser(authIdentifier);

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const isEmp = !['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN'].includes(userRole);

    let targetEmpId = parseInt(req.body.employee_id, 10);

    // Security: Employee can only submit leave for themselves
    if (isEmp) {
      if (targetEmpId && targetEmpId !== identity?.employeeId) {
        return res.status(403).json({ success: false, message: "Forbidden: You cannot apply for leave on behalf of another employee." });
      }
      targetEmpId = identity?.employeeId;
    } else {
      targetEmpId = targetEmpId || identity?.employeeId;
    }

    if (!targetEmpId) {
      return res.status(400).json({ success: false, message: "Valid employee ID is required." });
    }

    const { leave_type_code, leave_type_id, start_date, end_date, reason } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: "Start date and end date are required." });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason for leave is required." });
    }

    const sDate = new Date(start_date);
    const eDate = new Date(end_date);
    if (eDate < sDate) {
      return res.status(400).json({ success: false, message: "End date cannot be before start date." });
    }

    const requestedDays = Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1;
    if (requestedDays <= 0) {
      return res.status(400).json({ success: false, message: "Invalid date range." });
    }

    // Resolve Leave Type
    const typeRows = await new Promise(r => db.query(
      "SELECT id, name, code, max_days FROM leave_types WHERE code = ? OR id = ? OR name = ? LIMIT 1",
      [leave_type_code || '', leave_type_id || 0, leave_type_code || ''],
      (err, rows) => r(rows || [])
    ));

    if (!typeRows.length) {
      return res.status(400).json({ success: false, message: "Invalid leave type selected." });
    }
    const leaveType = typeRows[0];

    // Check Employee's Specific Available Leave Balance
    let balanceRows = await new Promise(r => db.query(
      "SELECT id, days_remaining, days_used FROM leave_balances WHERE employee_id = ? AND leave_type_id = ? LIMIT 1",
      [targetEmpId, leaveType.id],
      (err, rows) => r(rows || [])
    ));

    if (!balanceRows.length) {
      // Auto-initialize balance for this employee and leave type
      await new Promise(r => db.query(
        "INSERT INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining) VALUES (?, ?, 0, ?)",
        [targetEmpId, leaveType.id, leaveType.max_days || 12],
        () => r()
      ));
      balanceRows = [{ days_remaining: leaveType.max_days || 12, days_used: 0 }];
    }

    const availableDays = balanceRows[0].days_remaining;

    // Check for other pending applications for the same leave type
    const pendingRows = await new Promise(r => db.query(
      "SELECT COALESCE(SUM(DATEDIFF(end_date, start_date) + 1), 0) as pending_days FROM leave_applications WHERE employee_id = ? AND leave_type_id = ? AND status = 'Pending'",
      [targetEmpId, leaveType.id],
      (err, rows) => r(rows || [{ pending_days: 0 }])
    ));
    const pendingDays = parseFloat(pendingRows[0].pending_days) || 0;
    const effectiveAvailable = availableDays - pendingDays;

    if (requestedDays > effectiveAvailable) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. You have ${availableDays} day(s) available (${pendingDays} day(s) pending approval) for ${leaveType.name}, but requested ${requestedDays} day(s).`
      });
    }

    const insertSql = `
      INSERT INTO leave_applications (employee_id, leave_type_id, start_date, end_date, reason, status, applied_on)
      VALUES (?, ?, ?, ?, ?, 'Pending', CURDATE())
    `;

    db.query(insertSql, [targetEmpId, leaveType.id, start_date, end_date, reason.trim()], (err, result) => {
      if (err) {
        console.error("Leave application insert error:", err);
        return res.status(500).json({ success: false, message: "Leave submission failed", error: err.message });
      }
      const leaveId = result.insertId;

      // Trigger Notification
      const NotificationService = require("../services/NotificationService");
      NotificationService.triggerLeaveRequest(leaveId, targetEmpId, leaveType.name, start_date, end_date)
        .catch(e => console.error("Error triggering leave request notification:", e));

      res.json({
        success: true,
        message: "Leave application submitted successfully",
        id: leaveId,
        requestedDays,
        availableDays: availableDays - requestedDays
      });
    });
  } catch (err) {
    console.error("Exception in submitApplication:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;

  const appId = parseInt(id, 10);
  if (isNaN(appId) || appId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid leave application ID" });
  }

  if (!status || typeof status !== 'string' || !status.trim()) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }

  // Normalize status string (TitleCase)
  const rawStatus = status.trim().toLowerCase();
  let normStatus = 'Pending';
  if (rawStatus === 'approved') normStatus = 'Approved';
  else if (rawStatus === 'rejected') normStatus = 'Rejected';
  else if (rawStatus === 'pending') normStatus = 'Pending';
  else if (rawStatus === 'escalated') normStatus = 'Escalated';
  else {
    return res.status(400).json({ success: false, message: `Invalid status '${status}'. Must be Approved, Rejected, Pending, or Escalated.` });
  }

  const fetchSql = `
    SELECT la.*, lt.name as leave_name 
    FROM leave_applications la 
    LEFT JOIN leave_types lt ON la.leave_type_id = lt.id 
    WHERE la.id = ?
  `;
  db.query(fetchSql, [appId], (errFetch, fetchRows) => {
    if (errFetch) {
      console.error("Database error fetching leave application:", errFetch);
      return res.status(500).json({ success: false, message: "Database query error", error: errFetch.message });
    }

    if (!fetchRows || fetchRows.length === 0) {
      return res.status(404).json({ success: false, message: "Leave application not found" });
    }

    const app = fetchRows[0];
    const candidateApproverId = approved_by || (req.user && (req.user.employeeId || req.user.employee_id || req.user.id));

    // Check if candidate approver ID exists in employees table to satisfy foreign key constraint
    db.query("SELECT id FROM employees WHERE id = ?", [candidateApproverId], (errCheck, checkRows) => {
      const finalApproverId = (!errCheck && checkRows && checkRows.length > 0) ? checkRows[0].id : null;

      const sql = "UPDATE leave_applications SET status = ?, approved_by = ? WHERE id = ?";
      db.query(sql, [normStatus, finalApproverId, appId], async (errUpdate) => {
        if (errUpdate) {
          console.error("Database error updating leave application:", errUpdate);
          return res.status(500).json({ success: false, message: "Database update error", error: errUpdate.message });
        }

        // Leave Balance Sync on Status Change:
        // Calculate days for this application
        const sD = new Date(app.start_date);
        const eD = new Date(app.end_date);
        const appDays = (!isNaN(sD.getTime()) && !isNaN(eD.getTime()))
          ? (Math.ceil((eD - sD) / (1000 * 60 * 60 * 24)) + 1)
          : 1;

        if (normStatus === 'Approved' && app.status !== 'Approved') {
          // Deduct from remaining and add to used
          db.query(
            "UPDATE leave_balances SET days_remaining = GREATEST(0, days_remaining - ?), days_used = days_used + ? WHERE employee_id = ? AND leave_type_id = ?",
            [appDays, appDays, app.employee_id, app.leave_type_id],
            (bErr) => { if (bErr) console.error("Error updating leave balance on approval:", bErr); }
          );
        } else if (app.status === 'Approved' && (normStatus === 'Rejected' || normStatus === 'Pending')) {
          // Restore previously deducted balance
          db.query(
            "UPDATE leave_balances SET days_remaining = days_remaining + ?, days_used = GREATEST(0, days_used - ?) WHERE employee_id = ? AND leave_type_id = ?",
            [appDays, appDays, app.employee_id, app.leave_type_id],
            (bErr) => { if (bErr) console.error("Error restoring leave balance on rejection:", bErr); }
          );
        }

        try {
          const NotificationService = require("../services/NotificationService");
          let startStr = 'N/A';
          let endStr = 'N/A';
          if (app.start_date) {
            const sD = new Date(app.start_date);
            if (!isNaN(sD.getTime())) startStr = sD.toISOString().split('T')[0];
          }
          if (app.end_date) {
            const eD = new Date(app.end_date);
            if (!isNaN(eD.getTime())) endStr = eD.toISOString().split('T')[0];
          }
          NotificationService.triggerLeaveStatusUpdate(appId, app.employee_id, app.leave_name, normStatus, startStr, endStr)
            .catch(e => console.error("Error triggering leave status update notification:", e));
        } catch (notifErr) {
          console.error("Exception triggering notification on leave status update:", notifErr);
        }

        return res.status(200).json({
          success: true,
          message: `Leave application ${normStatus.toLowerCase()} successfully`,
          id: appId,
          status: normStatus
        });
      });
    });
  });
};

exports.getDashboardStats = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Total Employees
    const totalEmployees = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as count FROM employees WHERE status = 'Active'", (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0].count);
      });
    });

    // 2. On Leave Today
    const onLeaveTodayCount = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(DISTINCT employee_id) as count FROM leave_applications WHERE status = 'Approved' AND ? BETWEEN start_date AND end_date", [todayStr], (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0].count);
      });
    });

    // 3. Pending Approvals
    const pendingApprovals = await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as count FROM leave_applications WHERE status = 'Pending'", (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0].count);
      });
    });

    // 4. Leaves Taken This Month
    const leavesTakenThisMonth = await new Promise((resolve, reject) => {
      db.query("SELECT COALESCE(SUM(DATEDIFF(end_date, start_date) + 1), 0) as count FROM leave_applications WHERE status = 'Approved' AND MONTH(start_date) = MONTH(?) AND YEAR(start_date) = YEAR(?)", [todayStr, todayStr], (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0].count);
      });
    });

    // 5. On Leave Today List
    const onLeaveTodayList = await new Promise((resolve, reject) => {
      const sqlList = `
        SELECT la.employee_id, e.name, lt.code as leave_code, d.dept_name as dept, e.profile_photo as avatar
        FROM leave_applications la
        JOIN employees e ON la.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE la.status = 'Approved' AND ? BETWEEN la.start_date AND la.end_date
      `;
      db.query(sqlList, [todayStr], (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(r => ({
          name: r.name,
          role: r.dept || 'General Staff',
          type: r.leave_code,
          avatar: r.avatar ? `/${r.avatar}` : null
        })));
      });
    });

    // 6. Leave By Department list
    const leaveByDept = await new Promise((resolve, reject) => {
      const sqlDept = `
        SELECT 
          d.dept_name as dept, 
          COUNT(DISTINCT e.id) as emp,
          COALESCE(SUM(CASE WHEN la.status = 'Approved' THEN (DATEDIFF(la.end_date, la.start_date) + 1) ELSE 0 END), 0) as taken,
          COALESCE(SUM(CASE WHEN la.status = 'Pending' THEN 1 ELSE 0 END), 0) as pending
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.status = 'Active'
        LEFT JOIN leave_applications la ON la.employee_id = e.id
        GROUP BY d.id, d.dept_name
      `;
      db.query(sqlDept, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });

    // 7. Leave Distribution Summary
    const leaveDist = await new Promise((resolve, reject) => {
      const sqlDist = `
        SELECT lt.name, COALESCE(SUM(DATEDIFF(la.end_date, la.start_date) + 1), 0) as value
        FROM leave_types lt
        LEFT JOIN leave_applications la ON la.leave_type_id = lt.id AND la.status = 'Approved'
        GROUP BY lt.id, lt.name
      `;
      db.query(sqlDist, (err, rows) => {
        if (err) return reject(err);
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
        resolve(rows.map((r, i) => ({
          name: r.name,
          value: r.value || 0,
          color: colors[i % colors.length]
        })));
      });
    });

    return res.status(200).json({
      success: true,
      kpis: {
        totalEmployees,
        onLeaveToday: onLeaveTodayCount,
        leavesTaken: leavesTakenThisMonth,
        pendingApprovals,
        leaveEncashment: '₹0.00'
      },
      onLeaveToday: onLeaveTodayList,
      leaveByDepartment: leaveByDept,
      leaveDistribution: leaveDist
    });

  } catch (error) {
    console.error("Failed to load leave dashboard stats:", error);
    return res.status(500).json({ success: false, message: "Internal server error loading dashboard stats" });
  }
};

exports.getCompOffRequests = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']);
    const identity = await IdentityService.resolveUser(authIdentifier);

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const currentEmpId = identity?.employeeId || req.user?.employeeId || req.user?.employee_id;
    const currentTeamId = identity?.teamId;

    let whereClause = "";
    const params = [];

    if (['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'BRANCHMANAGER'].includes(userRole)) {
      // Full view - no restriction
    } else if (['TEAMLEADER', 'TEAMLEAD', 'LEAD'].includes(userRole)) {
      whereClause = `WHERE (
        (e.team_id IS NOT NULL AND e.team_id = ?) 
        OR co.employee_id = ? 
        OR e.team_id IN (SELECT id FROM teams WHERE team_lead_id = ?)
      )`;
      params.push(currentTeamId || 0, currentEmpId || 0, currentEmpId || 0);
    } else {
      // Standard employee sees only their own comp-off requests
      whereClause = `WHERE co.employee_id = ?`;
      params.push(currentEmpId || 0);
    }

    const sql = `
      SELECT 
        co.*,
        COALESCE(e.name, co.employee_name) as employee_name,
        e.profile_photo as avatar,
        COALESCE(d.dept_name, 'General') as dept
      FROM comp_off_requests co
      LEFT JOIN employees e ON co.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      ${whereClause}
      ORDER BY co.id DESC
    `;
    db.query(sql, params, (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    });
  } catch (err) {
    console.error("Error in getCompOffRequests:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitCompOffRequest = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']);
    const identity = await IdentityService.resolveUser(authIdentifier);

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const isEmp = !['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN'].includes(userRole);

    let targetEmpId = parseInt(req.body.employee_id, 10);

    // Security: Employee can only submit comp-off for themselves
    if (isEmp) {
      if (targetEmpId && targetEmpId !== identity?.employeeId) {
        return res.status(403).json({ success: false, message: "Forbidden: You can only submit comp-off requests for yourself." });
      }
      targetEmpId = identity?.employeeId;
    } else {
      targetEmpId = targetEmpId || identity?.employeeId;
    }

    if (!targetEmpId) {
      return res.status(400).json({ success: false, message: "Valid employee ID is required." });
    }

    const { worked_date, earned_date, expiry_date, total_days, reason } = req.body;
    if (!worked_date) {
      return res.status(400).json({ success: false, message: "Worked date is required." });
    }

    // Duplicate check: Prevent duplicate submission for the same employee and worked date
    const dupCheck = await new Promise(r => db.query(
      "SELECT id FROM comp_off_requests WHERE employee_id = ? AND worked_date = ? AND status != 'Rejected' LIMIT 1",
      [targetEmpId, worked_date],
      (err, rows) => r(rows || [])
    ));
    if (dupCheck.length > 0) {
      return res.status(400).json({ success: false, message: "A comp-off request for this worked date already exists." });
    }

    const numDays = parseFloat(total_days) || 1;
    const daysStr = `${numDays} Day${numDays > 1 ? 's' : ''}`;
    const hoursStr = `${Math.round(numDays * 8)}h 00m`;
    const eDate = earned_date || worked_date;
    const expDate = expiry_date || new Date(new Date(worked_date).getTime() + 90*24*60*60*1000).toISOString().split('T')[0];

    const sql = `
      INSERT INTO comp_off_requests (employee_id, employee_name, worked_date, earned_date, expiry_date, overtime_hours, earned_days, reason, status, approved_by, created_at)
      VALUES (?, (SELECT name FROM employees WHERE id = ?), ?, ?, ?, ?, ?, ?, 'Pending', '-', NOW())
    `;
    db.query(sql, [targetEmpId, targetEmpId, worked_date, eDate, expDate, hoursStr, daysStr, reason || 'Comp off request'], (err, result) => {
      if (err) {
        console.error("Error submitting comp off request:", err);
        return res.status(500).json({ success: false, message: "Failed to submit comp off request", error: err.message });
      }
      res.json({ success: true, message: "Comp off request created successfully", id: result.insertId });
    });
  } catch (err) {
    console.error("Exception in submitCompOffRequest:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCompOffStatus = async (req, res) => {
  try {
    const IdentityService = require("../services/IdentityService");
    const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || (req.headers && req.headers['x-employee-id']);
    const identity = await IdentityService.resolveUser(authIdentifier);

    const userRole = (identity?.role || req.user?.role || req.headers['x-user-role'] || 'EMPLOYEE').toUpperCase().replace(/[\s_-]+/g, '');
    const isAuthorized = ['SUPERADMIN', 'ADMIN', 'HR', 'HRMANAGER', 'HRADMIN', 'TEAMLEADER', 'TEAMLEAD'].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to approve or reject comp-off requests." });
    }

    const { id } = req.params;
    const { status, approved_by } = req.body;
    const approverName = approved_by || identity?.name || 'Management';

    const rows = await new Promise(r => db.query("SELECT * FROM comp_off_requests WHERE id = ?", [id], (err, res) => r(res || [])));
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Comp-off request not found." });
    }
    const compReq = rows[0];

    await new Promise((resolve, reject) => {
      db.query("UPDATE comp_off_requests SET status = ?, approved_by = ? WHERE id = ?", [status, approverName, id], (err) => {
        if (err) reject(err); else resolve();
      });
    });

    // If Approved, credit comp-off days to leave_balances for COMP
    if (status === 'Approved' && compReq.status !== 'Approved') {
      const days = parseFloat(compReq.earned_days) || 1;
      const compTypes = await new Promise(r => db.query("SELECT id FROM leave_types WHERE code = 'COMP' LIMIT 1", (err, res) => r(res || [])));
      if (compTypes.length > 0) {
        const compTypeId = compTypes[0].id;
        await new Promise((resolve) => {
          db.query(`
            INSERT INTO leave_balances (employee_id, leave_type_id, days_used, days_remaining)
            VALUES (?, ?, 0, ?)
            ON DUPLICATE KEY UPDATE days_remaining = days_remaining + ?
          `, [compReq.employee_id, compTypeId, days, days], (err) => {
            if (err) console.error("Error crediting comp off balance:", err);
            resolve();
          });
        });
      }
    }

    res.json({ success: true, message: "Comp off status updated successfully" });
  } catch (err) {
    console.error("Exception in updateCompOffStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
