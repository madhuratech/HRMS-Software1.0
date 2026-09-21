const db = require('../config/database');
const IdentityService = require('../services/IdentityService');

const NotificationController = {
  /**
   * Get notifications for the authenticated user
   */
  async getNotifications(req, res) {
    try {
      const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || 1;
      let identity = null;
      try {
        identity = await IdentityService.resolveUser(authIdentifier);
      } catch (idErr) {
        console.warn(`[NOTIFICATIONS WARN] User identity lookup warning (${idErr.code || idErr.message}), using token fallback.`);
      }

      const userId = identity?.userId || req.user?.userId || req.user?.id || 1;
      const employeeId = identity?.employeeId || req.user?.employeeId || req.user?.employee_id || 1;
      const roleKey = (identity?.role || req.user?.role || 'EMPLOYEE').toUpperCase();
      const teamId = identity?.teamId || req.user?.teamId;

      let sql = `
        SELECT * FROM notifications 
        WHERE (recipient_employee_id = ? OR recipient_user_id = ?)
      `;
      const params = [employeeId, userId];

      if (roleKey === 'SUPER_ADMIN' || roleKey === 'ADMIN') {
        sql += ` OR (recipient_employee_id IS NULL AND recipient_user_id IS NULL AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'))`;
      } else if (roleKey === 'HR_MANAGER' || roleKey === 'HR') {
        sql += ` OR (recipient_employee_id IS NULL AND recipient_user_id IS NULL AND role IN ('HR_MANAGER', 'HR'))`;
      } else if (roleKey === 'TEAM_LEADER' && teamId) {
        sql += ` OR (recipient_employee_id IS NULL AND recipient_user_id IS NULL AND role = 'TEAM_LEADER' AND team_id = ?)`;
        params.push(teamId);
      }

      sql += ` ORDER BY created_at DESC LIMIT 100`;

      db.query(sql, params, (err, rows) => {
        if (err) {
          const isNetErr = ['EHOSTUNREACH', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'].includes(err.code);
          if (isNetErr) {
            console.warn(`[NOTIFICATIONS WARN] DB connection unavailable (${err.code}), returning empty list.`);
            return res.json({ success: true, notifications: [], data: [], unreadCount: 0 });
          }
          console.error('[NOTIFICATIONS ERROR] Query error:', err.message || err);
          return res.status(500).json({ success: false, message: 'Failed to retrieve notifications' });
        }

        const rawRows = rows || [];
        const notificationsFormatted = rawRows.map(r => ({
          id: r.id,
          title: r.title,
          message: r.message,
          type: r.type,
          isRead: Boolean(r.is_read),
          is_read: Boolean(r.is_read),
          createdAt: r.created_at,
          created_at: r.created_at,
          readAt: r.read_at,
          actionUrl: r.action_url,
          action_url: r.action_url
        }));
        const unreadCount = notificationsFormatted.filter(n => !n.isRead).length;

        return res.json({
          success: true,
          notifications: notificationsFormatted,
          data: rawRows,
          unreadCount
        });
      });
    } catch (e) {
      const isNetErr = ['EHOSTUNREACH', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED'].includes(e.code);
      if (isNetErr) {
        console.warn(`[NOTIFICATIONS WARN] Transient network disconnect (${e.code}), returning empty fallback.`);
        return res.json({ success: true, notifications: [], data: [], unreadCount: 0 });
      }
      console.error('[NOTIFICATIONS EXCEPTION]', e.message || e);
      return res.status(500).json({ success: false, message: 'Server error during notifications retrieval' });
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      db.query(`UPDATE notifications SET is_read = 1, read_at = NOW(), updated_at = NOW() WHERE id = ?`, [id], (updateErr) => {
        if (updateErr) {
          console.error('[MARK READ ERROR]', updateErr);
          return res.status(500).json({ success: false, message: 'Failed to update notification status' });
        }
        return res.json({ success: true, message: 'Notification marked as read' });
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  /**
   * Mark all unread notifications for the user as read
   */
  async markAllRead(req, res) {
    try {
      const authIdentifier = (req.user && (req.user.email || req.user.userId || req.user.id || req.user.employeeId || req.user.employee_id)) || 1;
      const identity = await IdentityService.resolveUser(authIdentifier);

      const userId = identity?.userId || req.user?.userId || req.user?.id || 1;
      const employeeId = identity?.employeeId || req.user?.employeeId || req.user?.employee_id || 1;
      const roleKey = (identity?.role || req.user?.role || 'EMPLOYEE').toUpperCase();
      const teamId = identity?.teamId;

      let sql = `
        UPDATE notifications 
        SET is_read = 1, read_at = NOW(), updated_at = NOW() 
        WHERE is_read = 0 AND ((recipient_employee_id = ? OR recipient_user_id = ?)
      `;
      const params = [employeeId, userId];

      if (roleKey === 'SUPER_ADMIN' || roleKey === 'ADMIN') {
        sql += ` OR (recipient_employee_id IS NULL AND recipient_user_id IS NULL AND role IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'HR'))`;
      } else if (roleKey === 'HR_MANAGER' || roleKey === 'HR') {
        sql += ` OR (recipient_employee_id IS NULL AND recipient_user_id IS NULL AND role IN ('HR_MANAGER', 'HR'))`;
      } else if (roleKey === 'TEAM_LEADER' && teamId) {
        sql += ` OR (recipient_employee_id IS NULL AND recipient_user_id IS NULL AND role = 'TEAM_LEADER' AND team_id = ?)`;
        params.push(teamId);
      }
      sql += `)`;

      db.query(sql, params, (err, result) => {
        if (err) {
          console.error('[MARK ALL READ ERROR]', err);
          return res.status(500).json({ success: false, message: 'Failed to mark all as read' });
        }
        return res.json({ success: true, message: 'All notifications marked as read' });
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = NotificationController;
