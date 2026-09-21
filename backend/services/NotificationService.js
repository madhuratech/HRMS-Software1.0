const db = require('../config/database');

class NotificationService {
  /**
   * Helper to fetch employee details including role key
   */
  static async getEmployeeDetails(employeeId) {
    return new Promise((resolve) => {
      const sql = `
        SELECT e.*, COALESCE(r.role_key, 'EMPLOYEE') as role_key 
        FROM employees e 
        LEFT JOIN roles r ON e.role_id = r.id 
        WHERE e.id = ?
      `;
      db.query(sql, [employeeId], (err, rows) => {
        if (err || !rows || rows.length === 0) {
          db.query(`SELECT *, 'EMPLOYEE' as role_key FROM employees WHERE id = ?`, [employeeId], (err2, rows2) => {
            if (err2 || !rows2 || rows2.length === 0) resolve(null);
            else resolve(rows2[0]);
          });
        } else {
          resolve(rows[0]);
        }
      });
    });
  }

  /**
   * General method to create a single notification in DB
   */
  static async createNotification({
    recipient_user_id,
    recipient_employee_id,
    role,
    team_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url
  }) {
    // Avoid duplicates for specific unique events created within last 2 minutes or currently unread
    if (entity_type && entity_id && type && (recipient_employee_id || recipient_user_id)) {
      const checkSql = `
        SELECT id FROM notifications 
        WHERE type = ? AND entity_type = ? AND entity_id = ? 
          AND (recipient_employee_id = ? OR recipient_user_id = ?)
          AND (is_read = 0 OR created_at > NOW() - INTERVAL 2 MINUTE)
      `;
      const exists = await new Promise((resolve) => {
        db.query(checkSql, [type, entity_type, entity_id, recipient_employee_id || null, recipient_user_id || null], (err, rows) => {
          if (err) resolve(false);
          else resolve(rows.length > 0);
        });
      });
      if (exists) return null;
    }

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO notifications 
        (recipient_user_id, recipient_employee_id, role, team_id, type, title, message, entity_type, entity_id, action_url, is_read, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
      `;
      db.query(
        sql,
        [
          recipient_user_id || null,
          recipient_employee_id || null,
          role || null,
          team_id || null,
          type,
          title,
          message,
          entity_type || null,
          entity_id || null,
          action_url || null
        ],
        (err, res) => {
          if (err) {
            console.error('Error inserting notification:', err);
            return reject(err);
          }
          resolve({ id: res.insertId, title });
        }
      );
    });
  }

  /**
   * Notify admins and HR managers
   */
  static async notifyAdminsAndHR(type, title, message, entityType, entityId, actionUrl) {
    return new Promise((resolve) => {
      const sql = `
        SELECT e.id, e.team_id, COALESCE(r.role_key, 'ADMIN') as role_key 
        FROM employees e 
        LEFT JOIN roles r ON e.role_id = r.id 
        WHERE r.role_key IN ('SUPER_ADMIN', 'HR_MANAGER', 'ADMIN', 'HR') AND e.status = 'Active'
      `;
      db.query(sql, [], async (err, rows) => {
        if (err || !rows || rows.length === 0) {
          db.query(`SELECT id, team_id, 'ADMIN' as role_key FROM employees WHERE status = 'Active'`, async (err2, rows2) => {
            if (err2 || !rows2) return resolve([]);
            const promises = rows2.map(user => 
              this.createNotification({
                recipient_employee_id: user.id,
                role: user.role_key,
                team_id: user.team_id,
                type,
                title,
                message,
                entity_type: entityType,
                entity_id: entityId,
                action_url: actionUrl
              })
            );
            const results = await Promise.all(promises);
            resolve(results);
          });
          return;
        }
        const promises = rows.map(user => 
          this.createNotification({
            recipient_employee_id: user.id,
            role: user.role_key,
            team_id: user.team_id,
            type,
            title,
            message,
            entity_type: entityType,
            entity_id: entityId,
            action_url: actionUrl
          })
        );
        const results = await Promise.all(promises);
        resolve(results);
      });
    });
  }

  /**
   * Notify team leaders of a specific team
   */
  static async notifyTeamLeaders(teamId, type, title, message, entityType, entityId, actionUrl) {
    if (!teamId) return [];
    return new Promise((resolve) => {
      const sql = `
        SELECT e.id, e.team_id, COALESCE(r.role_key, 'TEAM_LEADER') as role_key 
        FROM employees e 
        LEFT JOIN roles r ON e.role_id = r.id 
        WHERE r.role_key IN ('TEAM_LEADER', 'TEAM_LEAD', 'TEAMLEADER')
          AND e.team_id = ? AND e.status = 'Active'
      `;
      db.query(sql, [teamId], async (err, rows) => {
        if (err || !rows || rows.length === 0) {
          db.query(
            `SELECT id, team_id, 'TEAM_LEADER' as role_key FROM employees WHERE team_id = ? AND status = 'Active'`,
            [teamId],
            async (err2, rows2) => {
              if (err2 || !rows2) return resolve([]);
              const promises = rows2.map(user => 
                this.createNotification({
                  recipient_employee_id: user.id,
                  role: user.role_key,
                  team_id: user.team_id,
                  type,
                  title,
                  message,
                  entity_type: entityType,
                  entity_id: entityId,
                  action_url: actionUrl
                })
              );
              const results = await Promise.all(promises);
              resolve(results);
            }
          );
          return;
        }
        const promises = rows.map(user => 
          this.createNotification({
            recipient_employee_id: user.id,
            role: user.role_key,
            team_id: user.team_id,
            type,
            title,
            message,
            entity_type: entityType,
            entity_id: entityId,
            action_url: actionUrl
          })
        );
        const results = await Promise.all(promises);
        resolve(results);
      });
    });
  }

  /**
   * Notify all active employees (e.g. for company announcements, holiday updates)
   */
  static async notifyAllEmployees(type, title, message, entityType, entityId, actionUrl) {
    return new Promise((resolve) => {
      const sql = `
        SELECT e.id, e.team_id, COALESCE(r.role_key, 'EMPLOYEE') as role_key 
        FROM employees e 
        LEFT JOIN roles r ON e.role_id = r.id 
        WHERE e.status = 'Active'
      `;
      db.query(sql, [], async (err, rows) => {
        if (err || !rows || rows.length === 0) {
          db.query(`SELECT id, team_id, 'EMPLOYEE' as role_key FROM employees WHERE status = 'Active'`, async (err2, rows2) => {
            if (err2 || !rows2) return resolve([]);
            const promises = rows2.map(user => 
              this.createNotification({
                recipient_employee_id: user.id,
                role: user.role_key,
                team_id: user.team_id,
                type,
                title,
                message,
                entity_type: entityType,
                entity_id: entityId,
                action_url: actionUrl
              })
            );
            const results = await Promise.all(promises);
            resolve(results);
          });
          return;
        }
        const promises = rows.map(user => 
          this.createNotification({
            recipient_employee_id: user.id,
            role: user.role_key,
            team_id: user.team_id,
            type,
            title,
            message,
            entity_type: entityType,
            entity_id: entityId,
            action_url: actionUrl
          })
        );
        const results = await Promise.all(promises);
        resolve(results);
      });
    });
  }

  /**
   * Trigger Leave Request notification flow
   */
  static async triggerLeaveRequest(leaveApplicationId, employeeId, leaveTypeName, startDateStr, endDateStr) {
    const emp = await this.getEmployeeDetails(employeeId);
    if (!emp) return;

    const title = 'New Leave Request';
    const message = `${emp.name} submitted a leave request: ${leaveTypeName || 'Leave'} from ${startDateStr} to ${endDateStr}.`;
    const actionUrl = '/leave-approval';

    // 1. Notify HR and Admin
    await this.notifyAdminsAndHR('LEAVE_REQUEST', title, message, 'leave', leaveApplicationId, actionUrl);

    // 2. Notify their Team Leader (if applicable)
    if (emp.team_id) {
      const tlTitle = 'Team Leave Request';
      const tlMessage = `${emp.name} from your team requested leave: ${leaveTypeName || 'Leave'} (${startDateStr} - ${endDateStr}).`;
      const tlActionUrl = '/team-leader/team-leave';
      await this.notifyTeamLeaders(emp.team_id, 'LEAVE_REQUEST', tlTitle, tlMessage, 'leave', leaveApplicationId, tlActionUrl);
    }
  }

  /**
   * Trigger Leave Status Update (Approved/Rejected/Cancelled)
   */
  static async triggerLeaveStatusUpdate(leaveApplicationId, employeeId, leaveTypeName, status, startDateStr, endDateStr) {
    const emp = await this.getEmployeeDetails(employeeId);
    const roleKey = emp ? emp.role_key : 'EMPLOYEE';
    const teamId = emp ? emp.team_id : null;

    const type = status === 'Approved' ? 'LEAVE_APPROVED' : status === 'Rejected' ? 'LEAVE_REJECTED' : 'LEAVE_CANCELLED';
    const title = `Leave ${status}`;
    const message = `Your ${leaveTypeName || 'Leave'} request for ${startDateStr || 'requested dates'} has been ${status ? status.toLowerCase() : 'updated'}.`;
    const actionUrl = '/employee/leave';

    await this.createNotification({
      recipient_employee_id: employeeId,
      role: roleKey,
      team_id: teamId,
      type,
      title,
      message,
      entity_type: 'leave',
      entity_id: leaveApplicationId,
      action_url: actionUrl
    });
  }

  /**
   * Trigger Task Assignment notification
   */
  static async triggerTaskAssignment(taskId, taskTitle, assigneeId, dueDateStr) {
    const emp = await this.getEmployeeDetails(assigneeId);
    if (!emp) return;

    const title = 'New Task Assigned';
    const message = `You have been assigned a new task: ${taskTitle}. Due: ${dueDateStr || 'N/A'}`;
    const actionUrl = '/employee/tasks';

    await this.createNotification({
      recipient_employee_id: assigneeId,
      role: emp.role_key,
      team_id: emp.team_id,
      type: 'TASK_ASSIGNED',
      title,
      message,
      entity_type: 'task',
      entity_id: taskId,
      action_url: actionUrl
    });
  }

  /**
   * Trigger Project Assignment notification
   */
  static async triggerProjectAssignment(projectId, projectName, employeeId) {
    const emp = await this.getEmployeeDetails(employeeId);
    if (!emp) return;

    const title = 'Added to Project';
    const message = `You have been added to the project: ${projectName}.`;
    const actionUrl = '/projects';

    await this.createNotification({
      recipient_employee_id: employeeId,
      role: emp.role_key,
      team_id: emp.team_id,
      type: 'PROJECT_ASSIGNED',
      title,
      message,
      entity_type: 'project',
      entity_id: projectId,
      action_url: actionUrl
    });
  }

  /**
   * Trigger Employee Profile Update notification
   */
  static async triggerEmployeeProfileUpdate(employeeId, updaterName) {
    const emp = await this.getEmployeeDetails(employeeId);
    if (!emp) return;

    const title = 'Employee Profile Updated';
    const message = `${emp.name} updated their profile information.`;
    const actionUrl = '/employees/profile';

    await this.notifyAdminsAndHR('EMPLOYEE_UPDATE', title, message, 'employee', employeeId, actionUrl);
  }

  /**
   * Trigger Permission Update notification
   */
  static async triggerPermissionUpdate(employeeId, moduleKeyName) {
    const emp = await this.getEmployeeDetails(employeeId);
    if (!emp) return;

    const title = 'Permission Updated';
    const message = `Your access permissions for ${moduleKeyName || 'user roles'} have been updated.`;
    const actionUrl = '/settings/users';

    await this.createNotification({
      recipient_employee_id: employeeId,
      role: emp.role_key,
      team_id: emp.team_id,
      type: 'PERMISSION_UPDATED',
      title,
      message,
      entity_type: 'permission',
      entity_id: moduleKeyName || 'rbac',
      action_url: actionUrl
    });
  }

  /**
   * Trigger Holiday Update notification
   */
  static async triggerHolidayUpdate(holidayId, holidayName, dateStr) {
    const title = 'Holiday Update';
    const message = `A new company holiday has been added: ${holidayName} on ${dateStr}.`;
    const actionUrl = '/holiday-list';

    await this.notifyAllEmployees('HOLIDAY_UPDATED', title, message, 'holiday', holidayId, actionUrl);
  }

  /**
   * Trigger HR Announcement notification
   */
  static async triggerHRAnnouncement(announcementId, announcementTitle) {
    const title = 'HR Update';
    const message = `New announcement: "${announcementTitle}".`;
    const actionUrl = '/employee/announcements';

    await this.notifyAllEmployees('HR_ANNOUNCEMENT', title, message, 'announcement', announcementId, actionUrl);
  }

  /**
   * Trigger Payslip Available notification
   */
  static async triggerPayslipAvailable(payslipId, employeeId, periodMonth, periodYear) {
    const emp = await this.getEmployeeDetails(employeeId);
    if (!emp) return;

    const title = 'Payslip Available';
    const message = `Your payslip for ${periodMonth} ${periodYear} is now available.`;
    const actionUrl = '/employee/payroll';

    await this.createNotification({
      recipient_employee_id: employeeId,
      role: emp.role_key,
      team_id: emp.team_id,
      type: 'PAYROLL_AVAILABLE',
      title,
      message,
      entity_type: 'payslip',
      entity_id: payslipId,
      action_url: actionUrl
    });
  }

  /**
   * Trigger Help Desk Query Created notification
   */
  static async triggerHelpDeskCreated(ticketId, creatorEmpId, ticketSubject) {
    const emp = await this.getEmployeeDetails(creatorEmpId);
    const empName = emp ? emp.name : `Employee #${creatorEmpId}`;
    const title = 'New Employee Query';
    const message = `${empName} submitted a new query: "${ticketSubject}".`;
    const actionUrl = '/help-desk';

    await this.notifyAdminsAndHR('HELPDESK_TICKET_CREATED', title, message, 'ticket', ticketId, actionUrl);
  }

  /**
   * Trigger Help Desk Ticket Status / Reply Update
   */
  static async triggerHelpDeskStatusUpdate(ticketId, creatorEmpId, ticketSubject, status) {
    const emp = await this.getEmployeeDetails(creatorEmpId);
    const roleKey = emp ? emp.role_key : 'EMPLOYEE';
    const teamId = emp ? emp.team_id : null;

    const title = 'Help Desk Query Response';
    const message = `Your query "${ticketSubject}" status has been updated to ${status}.`;
    const actionUrl = '/help-desk';

    await this.createNotification({
      recipient_employee_id: creatorEmpId,
      role: roleKey,
      team_id: teamId,
      type: 'HELPDESK_STATUS_UPDATED',
      title,
      message,
      entity_type: 'ticket',
      entity_id: ticketId,
      action_url: actionUrl
    });
  }

  /**
   * Trigger Expense Submission notification
   */
  static async triggerExpenseSubmitted(expenseId, employeeId, expenseTitle, amount) {
    const emp = await this.getEmployeeDetails(employeeId);
    const empName = emp ? emp.name : `Employee #${employeeId}`;

    const title = 'New Expense Claim';
    const message = `${empName} submitted an expense claim: "${expenseTitle}" (${amount || ''}).`;
    const actionUrl = '/expenses';

    await this.notifyAdminsAndHR('EXPENSE_SUBMITTED', title, message, 'expense', expenseId, actionUrl);

    if (emp && emp.team_id) {
      await this.notifyTeamLeaders(emp.team_id, 'EXPENSE_SUBMITTED', title, message, 'expense', expenseId, actionUrl);
    }
  }

  /**
   * Trigger Expense Status Update notification
   */
  static async triggerExpenseStatusUpdate(expenseId, employeeId, expenseTitle, status) {
    const emp = await this.getEmployeeDetails(employeeId);
    const roleKey = emp ? emp.role_key : 'EMPLOYEE';
    const teamId = emp ? emp.team_id : null;

    const title = `Expense ${status}`;
    const message = `Your expense claim "${expenseTitle}" has been ${status ? status.toLowerCase() : 'updated'}.`;
    const actionUrl = '/expenses';

    await this.createNotification({
      recipient_employee_id: employeeId,
      role: roleKey,
      team_id: teamId,
      type: 'EXPENSE_STATUS_UPDATED',
      title,
      message,
      entity_type: 'expense',
      entity_id: expenseId,
      action_url: actionUrl
    });
  }

  /**
   * Trigger Document Verification / Upload Notification
   */
  static async triggerDocumentUploaded(docId, employeeId, docName) {
    const emp = await this.getEmployeeDetails(employeeId);
    const empName = emp ? emp.name : `Employee #${employeeId}`;

    const title = 'New Employee Document Uploaded';
    const message = `${empName} uploaded a new document: "${docName}".`;
    const actionUrl = '/employees/documents';

    await this.notifyAdminsAndHR('DOCUMENT_UPLOADED', title, message, 'document', docId, actionUrl);
  }

  /**
   * Trigger Attendance Regularization notification
   */
  static async triggerAttendanceRegularization(regId, employeeId, regDateStr, status) {
    const emp = await this.getEmployeeDetails(employeeId);
    const roleKey = emp ? emp.role_key : 'EMPLOYEE';
    const teamId = emp ? emp.team_id : null;

    const title = `Attendance Regularization ${status}`;
    const message = `Your attendance regularization for ${regDateStr} has been ${status ? status.toLowerCase() : 'processed'}.`;
    const actionUrl = '/attendance/regularization';

    await this.createNotification({
      recipient_employee_id: employeeId,
      role: roleKey,
      team_id: teamId,
      type: 'ATTENDANCE_REGULARIZATION',
      title,
      message,
      entity_type: 'regularization',
      entity_id: regId,
      action_url: actionUrl
    });
  }

  /**
   * Fire a notification when a client event occurs.
   * Notifies Admins and HR managers.
   */
  static async notifyClientEvent(eventType, clientId, companyName, actorUserId) {
    try {
      let title, message;
      const actionUrl = `/clients/${clientId}`;

      switch (eventType) {
        case 'NEW_CLIENT':
          title = 'New Client Added';
          message = `A new client "${companyName}" has been added to the system.`;
          break;
        case 'CLIENT_UPDATED':
          title = 'Client Updated';
          message = `Client "${companyName}" information has been updated.`;
          break;
        case 'CLIENT_STATUS_CHANGED':
          title = 'Client Status Changed';
          message = `The status of client "${companyName}" has been changed.`;
          break;
        default:
          title = 'Client Activity';
          message = `An activity occurred for client "${companyName}".`;
      }

      await this.notifyAdminsAndHR(
        eventType,
        title,
        message,
        'client',
        clientId,
        actionUrl
      );
    } catch (err) {
      console.error('[NotificationService.notifyClientEvent] Error:', err.message);
    }
  }
}

module.exports = NotificationService;
